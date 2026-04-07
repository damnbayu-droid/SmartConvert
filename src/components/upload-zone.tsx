'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
  isUploading?: boolean;
}

export function UploadZone({
  onFilesSelected,
  maxFiles = 50,
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  isUploading = false,
}: UploadZoneProps) {
  const t = useTranslations('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Extended MIME types including HEIC
  const extendedFormats = [...acceptedFormats, '.heic', '.heif'];

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      if (files.length > maxFiles) {
        errors.push(t('error', { defaultValue: `Maximum ${maxFiles} files allowed` }));
        return { valid: [], errors };
      }

      for (const file of files) {
        // Check by extension for HEIC/HEIF since browser may not recognize MIME type
        const ext = file.name.toLowerCase().split('.').pop();
        const isHeic = ext === 'heic' || ext === 'heif';
        
        if (!acceptedFormats.includes(file.type) && !isHeic) {
          errors.push(`${file.name}: ${t('invalidFile')}`);
          continue;
        }
        if (file.size > maxSize) {
          errors.push(`${file.name}: ${t('fileTooLarge')}`);
          continue;
        }
        valid.push(file);
      }

      return { valid, errors };
    },
    [maxFiles, maxSize, acceptedFormats, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const { valid, errors } = validateFiles(files);

      errors.forEach((error) => toast.error(error));

      if (valid.length > 0) {
        setSelectedFiles(valid);
      }
    },
    [validateFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        const { valid, errors } = validateFiles(files);

        errors.forEach((error) => toast.error(error));

        if (valid.length > 0) {
          setSelectedFiles(valid);
        }
      }
    },
    [validateFiles]
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConvert = useCallback(() => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  }, [selectedFiles, onFilesSelected]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 px-4">
          {isUploading ? (
            <>
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground">{t('uploading')}</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">{t('dragDrop')}</p>
              <p className="text-muted-foreground mb-4">{t('or')}</p>
              <label>
                <input
                  type="file"
                  multiple
                  accept={extendedFormats.join(',')}
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button variant="outline" asChild>
                  <span>{t('browse')}</span>
                </Button>
              </label>
              <div className="mt-4 text-sm text-muted-foreground text-center space-y-1">
                <p>{t('supportedFormats')}</p>
                <p>{t('maxSize')} • {t('maxFiles')}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedFiles.length > 0 && !isUploading && (
        <div className="space-y-4">
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <FileImage className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px] md:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <Button onClick={handleConvert} size="lg">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Convert to WebP
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
