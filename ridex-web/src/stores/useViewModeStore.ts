/**
 * RIDEX Web — Viewport Presentation Store
 * Manages whether the application renders as a centered Smartphone Screen or Desktop Command Center.
 * Defaults to 'phone' per user specification.
 */

import { create } from 'zustand';

interface ViewModeState {
  isPhoneFrame: boolean;
  setPhoneFrame: (isPhone: boolean) => void;
  togglePhoneFrame: () => void;
}

const getInitialViewMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ridex_view_mode');
    if (saved !== null) {
      return saved === 'phone';
    }
  }
  // Default to phone screen
  return true;
};

export const useViewModeStore = create<ViewModeState>((set) => ({
  isPhoneFrame: getInitialViewMode(),

  setPhoneFrame: (isPhone: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ridex_view_mode', isPhone ? 'phone' : 'desktop');
    }
    set({ isPhoneFrame: isPhone });
  },

  togglePhoneFrame: () => {
    set((state) => {
      const next = !state.isPhoneFrame;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ridex_view_mode', next ? 'phone' : 'desktop');
      }
      return { isPhoneFrame: next };
    });
  },
}));
