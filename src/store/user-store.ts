import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const VIP_EMAILS = process.env.NEXT_PUBLIC_VIP_EMAILS 
  ? process.env.NEXT_PUBLIC_VIP_EMAILS.split(',').map(e => e.trim()) 
  : [];

export type PlanType = 'free' | 'weekly' | 'monthly' | 'lifetime';

interface UserState {
  email: string | null;
  planType: PlanType;
  conversionCount: number;
  lastAdsShownTime: number;
  setEmail: (email: string | null) => void;
  setPlan: (plan: PlanType) => void;
  incrementConversion: () => void;
  resetAdsTimer: () => void;
  logout: () => void;
  isVip: () => boolean;
  canUseVideo: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      email: null,
      planType: 'free',
      conversionCount: 0,
      lastAdsShownTime: Date.now(),
      
      setEmail: (email) => set({ email }),
      setPlan: (plan) => set({ planType: plan }),
      
      incrementConversion: () => set((state) => ({ 
        conversionCount: state.conversionCount + 1 
      })),
      
      resetAdsTimer: () => set({ 
        lastAdsShownTime: Date.now(),
        conversionCount: 0 
      }),
      
      logout: () => set({ email: null, planType: 'free' }),
      
      isVip: () => {
        const state = get();
        if (state.email === 'damnbayu@gmail.com') return true;
        return !!state.email && state.planType !== 'free';
      },
      
      canUseVideo: () => {
        const state = get();
        if (state.email === 'damnbayu@gmail.com') return true;
        return state.planType === 'lifetime';
      }
    }),
    {
      name: 'smart-convert-user-store',
    }
  )
);
