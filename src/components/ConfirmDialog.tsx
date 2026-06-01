'use client';
import { AlertTriangle, Trash2 } from 'lucide-react';

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = '削除する',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full rounded-2xl sm:max-w-sm shadow-xl">
        <div className="p-5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            {danger ? (
              <Trash2 size={20} className="text-red-600" />
            ) : (
              <AlertTriangle size={20} className="text-amber-600" />
            )}
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white ${
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
