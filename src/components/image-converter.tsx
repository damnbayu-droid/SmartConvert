'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback, useEffect } from 'react';
import { UploadZone } from './upload-zone';
import { ProgressBar } from './progress-bar';
import { CTAModal } from './cta-modal';
import { ResultDownload } from './result-download';
import { ToolSettings, type ConversionSettings } from './tool-settings';
import { LoadingSpinner } from './loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileImage, Zap, Shield, Upload } from 'lucide-react';

// Constants
const BATCH_SIZE = 5;
const SPONSOR_URL = 'https://indonesianvisas.com';

interface ProcessedFile {
  id: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  savedPercent: number;
}

interface ConverterProps {
  toolSlug: string;
  locale: string;
}

type ConverterState = 'idle' | 'uploading' | 'processing' | 'cta' | 'completed' | 'error';

export function ImageConverter({ toolSlug, locale }: ConverterProps) {
  const t = useTranslations();
  const [state, setState] = useState<ConverterState>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 82,
    effort: 4,
    nearLossless: true,
  });

  // Simulate file processing (in production, this would be handled by the worker)
  const processFiles = useCallback(async (uploadedFiles: File[]) => {
    setState('uploading');
    setTotalFiles(uploadedFiles.length);
    
    try {
      // Create job
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: uploadedFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
          })),
          toolSlug,
          settings,
        }),
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setJobId(data.jobId);
      setState('processing');
      
      // Simulate processing
      for (let i = 0; i < uploadedFiles.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProcessedCount(i + 1);
        
        // Check if batch complete
        if ((i + 1) % BATCH_SIZE === 0 && i + 1 < uploadedFiles.length) {
          setCurrentBatch(Math.floor((i + 1) / BATCH_SIZE));
          setState('cta');
          return; // Wait for CTA
        }
      }
      
      // Processing complete - simulate results
      const results: ProcessedFile[] = uploadedFiles.map((file, i) => ({
        id: `file-${i}`,
        originalName: file.name.replace(/\.[^.]+$/, '.webp'),
        originalSize: file.size,
        newSize: Math.floor(file.size * (0.1 + Math.random() * 0.3)), // 10-40% of original
        savedPercent: 60 + Math.random() * 30, // 60-90% saved
      }));
      
      setProcessedFiles(results);
      setDownloadUrl(`/api/download?jobId=${data.jobId}`);
      setState('completed');
      
    } catch (error) {
      console.error('Processing error:', error);
      setState('error');
      toast.error(t('errors.processingFailed'));
    }
  }, [toolSlug, settings, t]);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    processFiles(selectedFiles);
  }, [processFiles]);

  const handleCTAComplete = useCallback(() => {
    setState('processing');
    // Continue processing remaining files
  }, []);

  const handleNewConversion = useCallback(() => {
    setState('idle');
    setJobId(null);
    setFiles([]);
    setProcessedFiles([]);
    setCurrentBatch(0);
    setProcessedCount(0);
    setTotalFiles(0);
    setDownloadUrl(null);
  }, []);

  // Poll job status when processing
  useEffect(() => {
    if (state !== 'processing' || !jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/job-status?jobId=${jobId}`);
        const data = await response.json();
        
        setProcessedCount(data.processedFiles);
        
        if (data.status === 'waiting_cta') {
          setState('cta');
          clearInterval(pollInterval);
        } else if (data.status === 'completed') {
          setProcessedFiles(data.files || []);
          setDownloadUrl(data.downloadUrl);
          setState('completed');
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setState('error');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [state, jobId]);

  return (
    <div className="space-y-6">
      {/* Features bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
          <Upload className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{t('hero.features.bulk')}</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{t('hero.features.fast')}</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{t('hero.features.secure')}</span>
        </div>
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

      {(state === 'uploading' || state === 'processing') && (
        <Card>
          <CardContent className="py-8">
            <ProgressBar
              current={processedCount}
              total={totalFiles}
              status={state === 'uploading' ? 'uploading' : 'processing'}
            />
          </CardContent>
        </Card>
      )}

      {state === 'completed' && downloadUrl && processedFiles.length > 0 && (
        <ResultDownload
          downloadUrl={downloadUrl}
          files={processedFiles}
          onNewConversion={handleNewConversion}
        />
      )}

      {state === 'error' && (
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{t('errors.processingFailed')}</p>
            <Button variant="outline" onClick={handleNewConversion} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CTA Modal */}
      <CTAModal
        isOpen={state === 'cta'}
        onClose={handleCTAComplete}
        jobId={jobId || ''}
        sponsorUrl={SPONSOR_URL}
      />
    </div>
  );
}
