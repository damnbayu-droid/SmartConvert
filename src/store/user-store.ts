import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const VIP_EMAILS = process.env.NEXT_PUBLIC_VIP_EMAILS 
  ? process.env.NEXT_PUBLIC_VIP_EMAILS.split(',').map(e => e.trim()) 
  : [];

interface UserState {
  email: string | null;
  imageUsesRemaining: number;
  lastResetDate: string;
  setEmail: (email: string | null) => void;
  decrementImageUses: (amount?: number) => void;
  incrementImageUses: (amount: number) => void;
  checkAndResetDailyQuota: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      email: null,
      imageUsesRemaining: 2,
      lastResetDate: new Date().toISOString().split('T')[0],
      setEmail: (email) => set({ email }),
      decrementImageUses: (amount = 1) => set((state) => ({ 
        imageUsesRemaining: Math.max(0, state.imageUsesRemaining - amount) 
      })),
      incrementImageUses: (amount) => set((state) => ({
        imageUsesRemaining: state.imageUsesRemaining + amount
      })),
      checkAndResetDailyQuota: () => {
        const today = new Date().toISOString().split('T')[0];
        if (get().lastResetDate !== today) {
          set({ lastResetDate: today, imageUsesRemaining: 2 });
        }
      }
    }),
    {
      name: 'smart-convert-user-store',
    }
  )
);
