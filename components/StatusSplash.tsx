'use client';

import React from 'react';

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
  if (!open) return null;

  const colorByKind: Record<StatusKind, string> = {
    success: 'text-emerald-300 border-emerald-700 bg-emerald-900/40',
    error: 'text-red-300 border-red-700 bg-red-900/40',
    info: 'text-blue-300 border-blue-700 bg-blue-900/40',
    warning: 'text-amber-300 border-amber-700 bg-amber-900/40',
  };

  const Icon = () => {
    switch (kind) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.5 4.21a9 9 0 1010.29 10.29A9 9 0 007.5 4.21z"/></svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12 text-amber-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`w-[90%] max-w-lg rounded-2xl border p-8 text-center ${colorByKind[kind]} shadow-2xl`}> 
        <div className="flex justify-center mb-4"><Icon /></div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        {message ? <p className="text-slate-300 mb-6 whitespace-pre-wrap">{message}</p> : null}
        <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}


