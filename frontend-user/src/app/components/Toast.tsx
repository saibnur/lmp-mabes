'use client';

import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error';
}

export default function Toast({ message, visible, onClose, duration = 3000, type = 'success' }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className={`fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl transition-all ${type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-red-600 text-white shadow-red-500/20'
        }`}
    >
      {type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose} className="ml-2 rounded-full p-1 transition-colors hover:bg-white/20">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
