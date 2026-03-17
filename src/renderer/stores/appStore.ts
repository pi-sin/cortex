import { create } from 'zustand';
import type { AppId } from '../../shared/types';

interface AppState {
  activeApp: AppId;
  rightPanelOpen: boolean;
  setActiveApp: (app: AppId) => void;
  toggleRightPanel: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeApp: 'dashboard',
  rightPanelOpen: false,
  setActiveApp: (app) => set({ activeApp: app }),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
}));
