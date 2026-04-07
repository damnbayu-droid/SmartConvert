'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink, Loader2, CreditCard, AlertCircle } from 'lucide-react';

interface CTAModalProps {
  isOpen: boolean;
  onClose: (clicksFulfilled: boolean) => void;
  jobId: string;
  sponsorUrl?: string;
  requiredClicks?: number;
}

export function CTAModal({
  isOpen,
  onClose,
  jobId,
  sponsorUrl = 'https://indonesianvisas.com',
  requiredClicks = 1,
}: CTAModalProps) {
  const t = useTranslations('cta');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setClicks(0);
      setIsRedirecting(false);
      setIsReturning(false);
    }
  }, [isOpen]);

  const handleFreeContinue = useCallback(() => {
    setIsRedirecting(true);
    sessionStorage.setItem('pendingJobId', jobId);
    window.open(sponsorUrl, '_blank');
    
    setTimeout(() => {
      setIsRedirecting(false);
      const newClicks = clicks + 1;
      setClicks(newClicks);
      
      if (newClicks >= requiredClicks) {
        setIsReturning(true);
        setTimeout(() => {
          onClose(true);
        }, 1000);
      }
    }, 3000);
  }, [jobId, sponsorUrl, onClose, clicks, requiredClicks]);

  const isMultiClick = requiredClicks > 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && clicks >= requiredClicks) {
        onClose(true);
      } else if (!open) {
        onClose(false);
      }
    }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => {
        if (clicks < requiredClicks) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-6 w-6 text-red-500" />
            {isMultiClick ? `Support Required (${clicks}/${requiredClicks})` : 'Support Us to Continue'}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {isMultiClick && clicks < requiredClicks 
              ? `Please support us by visiting our sponsor ${requiredClicks - clicks} more time(s) to convert all your files. Alternatively, unlock lifetime full access!`
              : `Convert your files for free by interacting with our sponsor. Alternatively, unlock lifetime full access!`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-4">
          
          <Button
            onClick={handleFreeContinue}
            disabled={isRedirecting || isReturning || clicks >= requiredClicks}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wait 3 seconds...
              </>
            ) : isReturning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlocking files...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                {isMultiClick ? `Continue Free Use (${clicks}/${requiredClicks})` : `Continue Free Use`}
              </>
            )}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            onClick={() => window.open('https://pay.doku.com/p-link/p/WlZhSnHm9G', '_blank')}
            variant="outline"
            size="lg"
            className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Pay IDR 50K for Full Access
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            After paying, send proof of payment to <strong className="text-foreground">info@bali.enterprises</strong> to activate your email instantly.
          </p>

        </div>
      </DialogContent>
    </Dialog>
  );
}
