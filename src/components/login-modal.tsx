'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Key, ShieldCheck } from 'lucide-react';
import { useUserStore } from '@/store/user-store';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setInputEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { setEmail, setPlan } = useUserStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'pro') {
        setEmail(email);
        setPlan(data.plan); // Catat jenis paketnya (weekly/monthly/lifetime)
        toast.success(`Welcome back! Access granted as ${data.plan}.`);
        onClose();
      } else {
        toast.error(data.message || 'No active subscription found. Please buy a plan first.');
      }
    } catch (error: any) {
      toast.error('Failed to verify subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Sign In to Pro</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Enter your email to unlock your subscription and sync your Pro status across devices.
          </DialogDescription>
        </DialogHeader>

        {!isSent ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setInputEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Send Magic Link
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground">
              We'll send a passwordless login link to your inbox. No password needed.
            </p>
          </form>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="font-semibold text-lg">Check your inbox!</p>
            <p className="text-sm text-muted-foreground px-6">
              We've sent a login link to <strong>{email}</strong>. Click the link in the email to sign in.
            </p>
            <Button variant="outline" onClick={() => setIsSent(false)}>
              Try another email
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
