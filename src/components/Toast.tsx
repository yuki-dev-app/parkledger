'use client';
import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = { message: string; kind: 'success' | 'error' };

export default function Toast({ toast, onClose }: { toast: ToastType | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.kind === 'error';
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-xs w-full
      ${isError ? 'bg-red-500' : 'bg-green-600'}`}>
      {isError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}
