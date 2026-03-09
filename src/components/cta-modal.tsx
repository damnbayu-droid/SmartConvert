'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink, Loader2 } from 'lucide-react';

interface CTAModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  sponsorUrl?: string;
}

export function CTAModal({
  isOpen,
  onClose,
  jobId,
  sponsorUrl = 'https://indonesianvisas.com',
}: CTAModalProps) {
  const t = useTranslations('cta');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const handleContinue = useCallback(() => {
    setIsRedirecting(true);
    
    // Store job ID in sessionStorage for return
    sessionStorage.setItem('pendingJobId', jobId);
    
    // Open sponsor page in new tab
    window.open(sponsorUrl, '_blank');
    
    // Show returning state after delay
    setTimeout(() => {
      setIsRedirecting(false);
      setIsReturning(true);
      
      // Continue with job processing
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 3000);
  }, [jobId, sponsorUrl, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-6 w-6 text-red-500" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-primary">
              {t('message')}
            </p>
          </div>

          <Button
            onClick={handleContinue}
            disabled={isRedirecting || isReturning}
            size="lg"
            className="w-full"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('redirecting')}
              </>
            ) : isReturning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('returning')}
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('button')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
