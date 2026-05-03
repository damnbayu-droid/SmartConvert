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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  ExternalLink, 
  Loader2, 
  CreditCard, 
  Mail, 
  LockOpen, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useUserStore } from '@/store/user-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AdsBlockModalProps {
  isOpen: boolean;
  onClose: (unlocked: boolean) => void;
  reason?: 'limit' | 'time';
}

export function AdsBlockModal({
  isOpen,
  onClose,
  reason = 'limit',
}: AdsBlockModalProps) {
  const t = useTranslations('cta');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [hasClickedSponsor, setHasClickedSponsor] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const { setEmail, setPlan, resetAdsTimer } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      setHasClickedSponsor(false);
      setTimer(0);
    }
  }, [isOpen]);

  // Handle Sponsor Click
  const handleSponsorClick = () => {
    setIsRedirecting(true);
    window.open('https://indonesianvisas.com', '_blank');
    
    // Start 3 second countdown
    let timeLeft = 3;
    setTimer(timeLeft);
    
    const interval = setInterval(() => {
      timeLeft -= 1;
      setTimer(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsRedirecting(false);
        setHasClickedSponsor(true);
      }
    }, 1000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail || !inputEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsRedirecting(true);
    try {
      const response = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'pro') {
        setEmail(inputEmail.toLowerCase().trim());
        setPlan(data.plan); // Tambahkan ini agar status Pro aktif
        toast.success(`Access Unlocked as ${data.plan}!`);
        onClose(true);
      } else {
        toast.error(data.message || 'No active subscription found.');
      }
    } catch (error) {
      toast.error('Verification failed.');
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleContinue = () => {
    resetAdsTimer();
    onClose(true);
  };

  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'lifetime'>('lifetime');

  const handleBuy = async () => {
    if (!inputEmail || !inputEmail.includes('@')) {
      toast.error('Please enter your email to receive access');
      return;
    }

    setIsRedirecting(true);
    try {
      const amounts = { weekly: 16000, monthly: 160000, lifetime: 320000 };
      const response = await fetch('/api/payments/doku/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inputEmail, 
          plan: selectedPlan,
          amount: amounts[selectedPlan]
        }),
      });

      const data = await response.json();
      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
        toast.info('Opening payment gateway...');
      } else {
        throw new Error(data.error || 'Failed to create payment link');
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment system is currently unavailable');
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && hasClickedSponsor) {
        handleContinue();
      }
    }}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-red-100 rounded-full">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center font-bold">
            {reason === 'limit' ? 'Free Limit Reached' : 'Time for a Quick Break'}
          </DialogTitle>
          <DialogDescription className="text-base text-center pt-2">
            You have used your free daily quota or 15 minutes has passed. 
            Support us by visiting our sponsor or unlock full access.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          
          {/* Sponsor Section */}
          {!hasClickedSponsor ? (
            <Button
              onClick={handleSponsorClick}
              disabled={isRedirecting}
              size="lg"
              className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all"
            >
              {isRedirecting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Unlocking in {timer}s...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-6 w-6" />
                  <span>Visit Sponsor to Continue</span>
                </div>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              size="lg"
              className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-6 w-6 mr-2" />
              Continue to Website
            </Button>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                OR UNLOCK PRO (NO ADS)
              </span>
            </div>
          </div>

          {/* Unlock Section */}
          <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Step 1: Enter your email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-11"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleEmailSubmit} className="h-11 px-6 bg-orange-600 hover:bg-orange-700">
                  Unlock
                </Button>
              </div>
            </div>

            <Label className="text-sm font-semibold block mt-4 text-center">Step 2: Choose Plan & Pay</Label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'weekly', price: '$1', time: '1 Week' },
                { id: 'monthly', price: '$10', time: '2 Months' },
                { id: 'lifetime', price: '$20', time: 'Lifetime' }
              ].map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id as any)}
                  className={cn(
                    "p-2 border rounded text-center text-[10px] cursor-pointer transition-all",
                    selectedPlan === p.id ? "bg-orange-600 text-white border-orange-600 shadow-md scale-105" : "bg-background hover:border-orange-200"
                  )}
                >
                  <div className={cn("font-bold", selectedPlan === p.id ? "text-white" : "text-orange-600")}>{p.price}</div>
                  <div>{p.time}</div>
                </div>
              ))}
            </div>
            
            <Button 
              type="button"
              variant="outline"
              className="w-full h-11 border-orange-200 text-orange-700 hover:bg-orange-50 font-bold"
              onClick={handleBuy}
              disabled={isRedirecting}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isRedirecting ? 'Generating Link...' : 'Buy Pro via DOKU'}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
