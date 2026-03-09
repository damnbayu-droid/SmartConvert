'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileArchive, RotateCcw, CheckCircle } from 'lucide-react';

interface ProcessedFile {
  id: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  savedPercent: number;
}

interface ResultDownloadProps {
  downloadUrl: string;
  files: ProcessedFile[];
  onNewConversion?: () => void;
}

export function ResultDownload({
  downloadUrl,
  files,
  onNewConversion,
}: ResultDownloadProps) {
  const t = useTranslations('result');

  const totalOriginal = files.reduce((sum, f) => sum + f.originalSize, 0);
  const totalNew = files.reduce((sum, f) => sum + f.newSize, 0);
  const totalSaved = totalOriginal - totalNew;
  const savedPercent = totalOriginal > 0 ? (totalSaved / totalOriginal) * 100 : 0;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Success message */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
        <CheckCircle className="h-6 w-6 flex-shrink-0" />
        <p className="font-medium">{t('title')}</p>
      </div>

      {/* Summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversion Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{files.length}</p>
              <p className="text-sm text-muted-foreground">Files</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{formatSize(totalOriginal)}</p>
              <p className="text-sm text-muted-foreground">{t('originalSize')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{formatSize(totalNew)}</p>
              <p className="text-sm text-muted-foreground">{t('newSize')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {savedPercent.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">{t('saved')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y max-h-64 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{file.originalName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSize(file.originalSize)} → {formatSize(file.newSize)}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600 dark:text-green-400">
                  -{file.savedPercent.toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="flex-1">
          <a href={downloadUrl} download>
            <FileArchive className="mr-2 h-5 w-5" />
            {files.length > 1 ? t('download') : t('downloadSingle')}
          </a>
        </Button>
        {onNewConversion && (
          <Button
            variant="outline"
            size="lg"
            onClick={onNewConversion}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            {t('newConversion')}
          </Button>
        )}
      </div>
    </div>
  );
}
