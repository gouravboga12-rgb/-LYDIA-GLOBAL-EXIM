import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, CheckCircle, AlertCircle, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/useToastStore';
import { useCartStore } from '../store/useCartStore';

export function Toast() {
  const { toast, hideToast } = useToastStore();
  const { items } = useCartStore();
  const navigate = useNavigate();

  const totalCartCount = items.reduce((sum, item) => sum + (item.qty || 1), 0);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -25, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.94 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-[115px] sm:top-[125px] md:top-[135px] right-3 sm:right-6 md:right-8 z-[9999999] w-[calc(100vw-24px)] sm:w-auto sm:max-w-md pointer-events-auto"
        >
          <div className="bg-[#45055B] text-white rounded-2xl border-2 border-[#D4AF37]/60 p-4 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col gap-3">
            {/* Ambient gold glow */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  toast.type === 'error' 
                    ? 'bg-red-500/20 text-red-300 border border-red-400/30' 
                    : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                }`}>
                  {toast.type === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                  )}
                </div>

                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      {toast.title || (toast.type === 'error' ? 'Cart Notice' : 'Added to Cart')}
                    </span>
                    {totalCartCount > 0 && toast.type !== 'error' && (
                      <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] font-bold px-1.5 py-0.2 rounded-full">
                        {totalCartCount} in cart
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-xs sm:text-sm text-gray-100 leading-snug">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={hideToast}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Bar with "Check Cart" button */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#D4AF37]/20">
              <span className="text-[11px] text-[#D4AF37]/90 font-medium hidden sm:inline">
                {toast.type === 'error' ? 'Check your cart details' : 'Item ready in your cart'}
              </span>

              <button
                type="button"
                onClick={() => {
                  hideToast();
                  navigate('/cart');
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B38827] hover:from-[#E5C158] hover:to-[#C49938] text-[#45055B] font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <span>Check Cart ({totalCartCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
