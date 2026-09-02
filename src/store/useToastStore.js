import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toast: null,
  showToast: (message, type = 'success', options = {}) => {
    const id = Date.now();
    const duration = options.duration || (type === 'error' ? 5000 : 4500);
    set({
      toast: {
        message,
        type,
        id,
        actionLabel: options.actionLabel || (type === 'success' || (typeof message === 'string' && message.toLowerCase().includes('cart')) ? 'View Cart →' : null),
        actionUrl: options.actionUrl || '/cart',
        title: options.title || (type === 'error' ? 'Cart Notice' : 'Added to Cart')
      }
    });
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, duration);
  },
  hideToast: () => set({ toast: null }),
}));
