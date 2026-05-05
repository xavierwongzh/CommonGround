'use client';

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from './ui/cn';

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm',
            'animate-in slide-in-from-bottom-2 duration-200',
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          )}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          ) : toast.type === 'success' ? (
            <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          )}
          <p className="flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
