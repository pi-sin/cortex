import { create } from 'zustand';

export type InboxFilter = 'all' | 'unread' | 'priority';

interface NotificationState {
  filter: InboxFilter;
  setFilter: (filter: InboxFilter) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
