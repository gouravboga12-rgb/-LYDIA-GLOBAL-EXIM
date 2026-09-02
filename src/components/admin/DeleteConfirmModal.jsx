import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export function DeleteConfirmModal({
  isOpen,
  title = "Confirm Deletion",
  message,
  itemName = "",
  confirmText = "Okay, Delete",
  cancelText = "Cancel",
  isDeleting = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        // Sticky: prevents closing when clicking outside backdrop
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#45055B]/15 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-red-500 via-[#D4AF37] to-[#45055B]" />

          <div className="p-6 sm:p-7 text-center">
            {/* Top Warning Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8 text-red-500 stroke-[2.2]" />
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#45055B] mb-2 tracking-tight">
              {title}
            </h3>

            {/* Message Body */}
            <div className="text-sm font-sans text-[#45055B]/70 leading-relaxed mb-6">
              {message ? (
                message
              ) : (
                <>
                  Are you sure you want to permanently delete{" "}
                  {itemName ? (
                    <span className="font-bold text-[#45055B] bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#45055B]/10 mx-1 inline-block">
                      {itemName}
                    </span>
                  ) : (
                    "this item"
                  )}
                  ? This action is irreversible.
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onCancel}
                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-sans font-bold text-sm hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirm}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{confirmText}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
