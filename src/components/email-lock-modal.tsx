'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LockOpen, Mail, ShieldAlert } from 'lucide-react';
import { useUserStore, VIP_EMAILS } from '@/store/user-store';
import { toast } from 'sonner';

interface EmailLockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailLockModal({ isOpen, onClose }: EmailLockModalProps) {
  const t = useTranslations('cta');
  const [inputEmail, setInputEmail] = useState('');
  const { setEmail } = useUserStore();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail || !inputEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (VIP_EMAILS.includes(inputEmail.toLowerCase().trim())) {
      setEmail(inputEmail.toLowerCase().trim());
      toast.success('Full Access Unlocked!');
      onClose();
    } else {
      toast.error('Email not registered for Full Access.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LockOpen className="h-6 w-6 text-green-500" />
            Unlock Full Access
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Enter your registered email to permanently unlock all features, remove limits, and get unlimited file conversions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUnlock} className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10 h-10"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gap-2">
            <LockOpen className="h-4 w-4" /> Unlock Pro Access
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
