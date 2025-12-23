import { create } from 'zustand';

export const useUserStore = create<{
  selectedUserId: number | null;
  setSelectedUserId: (id: number) => void;
  clearSelectedUserId: () => void;
}>((set) => ({
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  clearSelectedUserId: () => set({ selectedUserId: null }),
}));