'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadZone } from './upload-zone';
import { ProgressBar } from './progress-bar';
import { AdsBlockModal } from './ads-block-modal';
import { ResultDownload } from './result-download';
import { ToolSettings, type ConversionSettings } from './tool-settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Zap, Shield, Upload, AlertTriangle, RotateCcw } from 'lucide-react';
import { useUserStore, VIP_EMAILS } from '@/store/user-store';


/* ─── Constants ─── */
const BATCH_SIZE = 5;
const SPONSOR_URL = 'https://indonesianvisas.com';

/* ─── Types ─── */
interface ProcessedFile {
  id: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  savedPercent: number;
  blob: Blob;
  url: string;
}

type ConverterState = 'idle' | 'processing' | 'cta' | 'completed' | 'error';

/* ─── CDN Helper ─── */
async function loadHeic2Any(): Promise<any> {
    if ((window as any).heic2any) return (window as any).heic2any;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/heic2any@0.0.4/dist/heic2any.js';
        script.onload = () => resolve((window as any).heic2any);
        script.onerror = () => reject(new Error('Failed to load HEIC converter'));
        document.head.appendChild(script);
    });
}

export function ImageConverter({ toolSlug, locale }: { toolSlug: string; locale: string }) {
  const t = useTranslations();
  const [state, setState] = useState<ConverterState>('idle');
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 82,
    effort: 4,
    nearLossless: true,
  });

  const { email, conversionCount, incrementConversion, isVip } = useUserStore();
  const [showAds, setShowAds] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  /* ─── Core Conversion Logic (Browser-side) ─── */
  const convertImage = async (file: File, settings: ConversionSettings): Promise<ProcessedFile> => {
    let sourceFile = file;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    // 1. Handle HEIC/HEIF via CDN library
    if (ext === '.heic' || ext === '.heif') {
        const heic2any = await loadHeic2Any();
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        sourceFile = new File([Array.isArray(converted) ? converted[0] : converted], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(sourceFile);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Conversion failed'));
          
          const newName = file.name.replace(/\.[^.]+$/, '.webp');
          const result: ProcessedFile = {
            id: crypto.randomUUID(),
            originalName: newName,
            originalSize: file.size,
            newSize: blob.size,
            savedPercent: Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100)),
            blob,
            url: URL.createObjectURL(blob),
          };
          resolve(result);
        }, 'image/webp', settings.quality / 100);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${file.name}`));
      };
      
      img.src = url;
    });
  };

  const handleFilesSelected = useCallback(async (files: File[]) => {
    // Check Ads Trigger
    if (!isVip() && (conversionCount + files.length > 4)) {
      setPendingFiles(files);
      setShowAds(true);
      return;
    }

    setTotalFiles(files.length);
    setState('processing');
    setProcessedFiles([]);
    setProcessedCount(0);

    const filesToProcess = [...files];
    const results: ProcessedFile[] = [];
    
    try {
      // Process in batches of BATCH_SIZE to avoid freezing the UI
      for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
        const batch = filesToProcess.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(file => convertImage(file, settings))
        );
        
        results.push(...batchResults);
        setProcessedFiles(prev => [...prev, ...batchResults]);
        setProcessedCount(prev => prev + batchResults.length);
        
        // Increment global count
        for (let j = 0; j < batchResults.length; j++) incrementConversion();
      }
      setState('completed');
    } catch (error) {
      console.error('Conversion error:', error);
      setState('error');
      toast.error('Some images failed to convert.');
    }
  }, [email, incrementConversion, isVip, conversionCount, settings]);

  const handleAdsComplete = (unlocked: boolean) => {
    setShowAds(false);
    if (unlocked && pendingFiles.length > 0) {
      const filesToProcess = [...pendingFiles];
      setPendingFiles([]);
      handleFilesSelected(filesToProcess);
    }
  };

  const handleNewConversion = useCallback(() => {
    processedFiles.forEach(f => URL.revokeObjectURL(f.url));
    setProcessedFiles([]);
    setProcessedCount(0);
    setTotalFiles(0);
    setState('idle');
  }, [processedFiles]);

  // 1-Minute Auto-Delete functionality
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state === 'completed') {
      timer = setTimeout(() => {
        handleNewConversion();
        toast.info('Session cleared automatically to save memory.');
      }, 60000); // 60 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [state, handleNewConversion]);

  const downloadAll = useCallback(async () => {
    if (processedFiles.length === 0) return;
    try {
      const [JSZip, { saveAs }] = await Promise.all([
        import('jszip').then(mod => mod.default),
        import('file-saver')
      ]);

      const zip = new JSZip();
      processedFiles.forEach((file) => {
        zip.file(file.originalName, file.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'smart-convert-images.zip');
      
      toast.success('Downloaded ZIP archive!');
    } catch (e) {
      toast.error('Failed to create ZIP archive.');
    }
  }, [processedFiles]);

  return (
    <div className="space-y-6">
      {/* Features bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Upload, label: 'Browser-side', color: 'text-blue-500' },
          { icon: Zap, label: 'Super Fast', color: 'text-yellow-500' },
          { icon: Shield, label: '100% Private', color: 'text-green-500' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
            <Icon className={cn('h-4 w-4', color)} />
            <span className="text-xs sm:text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      {state === 'idle' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UploadZone onFilesSelected={handleFilesSelected} />
          </div>
          <div>
            <ToolSettings onSettingsChange={setSettings} />
          </div>
        </div>
      )}

      {state === 'processing' && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center">
            <ProgressBar
              current={processedCount}
              total={totalFiles}
              status="processing"
            />
            <p className="text-sm text-muted-foreground mt-4">
              Processing in your browser... {processedCount} / {totalFiles}
            </p>
          </CardContent>
        </Card>
      )}

      {state === 'completed' && processedFiles.length > 0 && (
        <div className="space-y-4">
            <ResultDownload
                downloadUrl="#" // Not used for browser-side
                files={processedFiles}
                onNewConversion={handleNewConversion}
            />
            <Button onClick={downloadAll} variant="default" className="w-full h-12 gap-2">
                <Zap className="h-4 w-4" /> Download All Converted Files
            </Button>
        </div>
      )}

      {state === 'error' && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-semibold">Something went wrong</p>
            <p className="text-sm text-muted-foreground mb-6">Conversion failed. Please check your image format and try again.</p>
            <Button variant="outline" onClick={handleNewConversion} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <AdsBlockModal
        isOpen={showAds}
        onClose={handleAdsComplete}
        reason="limit"
      />
    </div>
  );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
