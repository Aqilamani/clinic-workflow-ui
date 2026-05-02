import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = Date.now();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
}));