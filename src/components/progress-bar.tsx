'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  current: number;
  total: number;
  status?: 'uploading' | 'processing' | 'completed' | 'error';
}

export function ProgressBar({ current, total, status = 'processing' }: ProgressBarProps) {
  const t = useTranslations('processing');
  const progress = total > 0 ? (current / total) * 100 : 0;

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return t('uploading', { defaultValue: 'Uploading...' });
      case 'processing':
        return t('converting');
      case 'completed':
        return t('complete');
      case 'error':
        return t('error');
      default:
        return t('converting');
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{getStatusText()}</span>
        <span className="text-sm text-muted-foreground">
          {current} / {total} {t('filesProcessed')}
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              i < current
                ? status === 'error' && i === current - 1
                  ? 'bg-destructive'
                  : 'bg-primary'
                : 'bg-muted'
            )}
          />
        ))}
        {total > 20 && (
          <span className="text-xs text-muted-foreground ml-2">...</span>
        )}
      </div>
    </div>
  );
}
