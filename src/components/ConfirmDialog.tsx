'use client';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useScrollLock } from '@/lib/use-scroll-lock';

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ title, message, confirmLabel = '削除する', danger = true, onConfirm, onCancel }: Props) {
  useScrollLock();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full rounded-2xl sm:max-w-sm shadow-xl">
        <div className="p-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            {danger
              ? <Trash2 size={22} className="text-red-600 dark:text-red-400" />
              : <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400" />
            }
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-2">{title}</h3>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 px-4 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3.5 rounded-xl font-bold text-base text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
