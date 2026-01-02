'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type StatusKind = 'success' | 'error' | 'info' | 'warning';

export default function StatusSplash({
  open,
  kind = 'info',
  title,
  message,
  onClose,
}: {
  open: boolean;
  kind?: StatusKind;
  title: string;
  message?: string;
  onClose: () => void;
}) {
  const colorByKind: Record<StatusKind, { bg: string; text: string; icon: string; border: string }> = {
    success: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      icon: 'text-green-500',
      border: 'border-green-100'
    },
    error: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      icon: 'text-red-500',
      border: 'border-red-100'
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      icon: 'text-blue-500',
      border: 'border-blue-100'
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      icon: 'text-amber-500',
      border: 'border-amber-100'
    },
  };

  const Icon = () => {
    switch (kind) {
      case 'success':
        return (
          <svg className={`w-12 h-12 ${colorByKind[kind].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`w-12 h-12 ${colorByKind[kind].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`w-12 h-12 ${colorByKind[kind].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className={`w-12 h-12 ${colorByKind[kind].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        );
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`w-full max-w-md ${colorByKind[kind].bg} rounded-[40px] border ${colorByKind[kind].border} p-10 text-center shadow-2xl relative z-10`}
          >
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <Icon />
              </motion.div>
            </div>
            <h3 className={`text-2xl font-black ${colorByKind[kind].text} mb-3 tracking-tight`}>{title}</h3>
            {message ? <p className="text-brand-muted font-medium mb-8 leading-relaxed">{message}</p> : null}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="bg-brand-dark text-white font-black py-4 px-10 rounded-2xl transition-colors shadow-lg shadow-black/10 text-sm"
            >
              Close
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
