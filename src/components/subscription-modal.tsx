'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  ShieldCheck, 
  Video, 
  Infinity, 
  CheckCircle2, 
  Star,
  Flame,
  Crown,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useUserStore } from '@/store/user-store';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    id: 'weekly',
    name: 'Weekly Trial',
    price: '$1',
    duration: '7 Days',
    icon: Zap,
    color: 'from-blue-500 to-indigo-600',
    features: ['No Ads', 'Unlimited Image Tools', 'No Video Tools', 'Single Use'],
  },
  {
    id: 'monthly',
    name: 'Pro Monthly',
    price: '$10',
    duration: '2 Months',
    icon: Star,
    color: 'from-emerald-500 to-teal-600',
    features: ['No Ads', 'Unlimited Image Tools', 'No Video Tools', 'Priority Support'],
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime Ultra',
    price: '$20',
    duration: 'Forever',
    icon: Crown,
    color: 'from-orange-500 to-red-600',
    features: ['No Ads', 'Unlimited Image Tools', 'FULL Video Tools', 'Lifetime Updates'],
  },
];

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'lifetime'>('lifetime');
  const [email, setLocalEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { email: storeEmail } = useUserStore();

  const handleSubscribe = async () => {
    const targetEmail = storeEmail || email;
    
    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Please enter a valid email to continue');
      return;
    }

    setIsLoading(true);
    try {
      // Map plans to amounts (IDR)
      const amounts = {
        weekly: 16000,
        monthly: 160000,
        lifetime: 320000,
      };

      const response = await fetch('/api/payments/doku/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: targetEmail, 
          plan: selectedPlan,
          amount: amounts[selectedPlan]
        }),
      });

      const data = await response.json();
      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
        toast.info('Opening payment gateway...');
        onClose();
      } else {
        throw new Error(data.error || 'Failed to create payment link');
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment system is currently unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          <div className="relative bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            
            {/* Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-orange-600/20 via-indigo-600/20 to-emerald-600/20 blur-3xl opacity-50 -z-10" />

            <div className="p-8">
              <DialogHeader className="mb-8">
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
                    <Flame className="h-4 w-4" /> Limited Time Offer
                  </span>
                </div>
                <DialogTitle className="text-4xl font-extrabold text-center tracking-tight">
                  Unlock <span className="text-orange-600">Smart Convert</span> Pro
                </DialogTitle>
                <DialogDescription className="text-center text-lg text-muted-foreground mt-2">
                  Say goodbye to ads and limits. Choose a plan that fits your workflow.
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id as any)}
                    className={cn(
                      "relative group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1",
                      selectedPlan === plan.id 
                        ? "border-orange-500 bg-orange-50/10 shadow-lg ring-4 ring-orange-500/10" 
                        : "border-muted bg-muted/30 hover:border-orange-200"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase shadow-sm">
                        Best Value
                      </div>
                    )}

                    <div className={cn(
                      "w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br text-white shadow-md",
                      plan.color
                    )}>
                      <plan.icon className="h-6 w-6" />
                    </div>

                    <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black">{plan.price}</span>
                      <span className="text-xs text-muted-foreground">/ {plan.duration}</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          {feature.includes('No Video') ? (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground/50" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                          <span className={cn(
                            feature.includes('No Video') ? "text-muted-foreground/60" : "text-foreground"
                          )}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className={cn(
                      "absolute bottom-4 right-4 transition-opacity",
                      selectedPlan === plan.id ? "opacity-100" : "opacity-0"
                    )}>
                      <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!storeEmail && (
                <div className="max-w-md mx-auto mb-6 space-y-2">
                  <label className="text-sm font-semibold text-center block">Enter your email to receive access:</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full pl-10 h-12 rounded-xl border border-muted bg-muted/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={email}
                      onChange={(e) => setLocalEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                <Button 
                  size="lg" 
                  disabled={isLoading}
                  className="w-full md:w-80 h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/20 transition-all active:scale-95"
                  onClick={handleSubscribe}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2 italic">Generating Link...</span>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Upgrade Now
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Secure Payment via DOKU Gateway
                </p>
              </div>
            </div>

          {/* Footer Info */}
          <div className="bg-muted/50 p-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              After payment, your account will be activated automatically. 
              Need help? Contact <span className="text-orange-600 font-semibold">info@bali.enterprises</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
