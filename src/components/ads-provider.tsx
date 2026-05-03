'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { AdsBlockModal } from './ads-block-modal';
import { usePathname } from 'next/navigation';

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const { isVip, lastAdsShownTime, resetAdsTimer } = useUserStore();
  const [showAds, setShowAds] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show ads on dashboard or info pages
    if (pathname.includes('/dashboard') || pathname.includes('/info')) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;
      
      if (!isVip() && now - lastAdsShownTime >= fifteenMinutes) {
        setShowAds(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isVip, lastAdsShownTime, pathname]);

  return (
    <>
      {children}
      <AdsBlockModal 
        isOpen={showAds} 
        onClose={() => setShowAds(false)} 
        reason="time"
      />
    </>
  );
}
