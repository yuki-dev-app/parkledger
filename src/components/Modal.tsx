'use client';
import { X } from 'lucide-react';
import { useScrollLock } from '@/lib/use-scroll-lock';

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ title, onClose, children }: Props) {
  // iOS Safari では overflow:hidden が効かないため position:fixed で対応
  useScrollLock();

  return (
    // オーバーレイ
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* モーダル本体 — モバイルはボトムシート、PC は中央 */}
      <div
        className="
          bg-white w-full
          rounded-t-2xl sm:rounded-2xl
          sm:max-w-md sm:mx-4
          max-h-[90dvh] overflow-y-auto modal-scroll
          flex flex-col
        "
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            style={{ minWidth: '40px', minHeight: '40px' }}
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-4 py-4 flex flex-col gap-4">
          {children}
        </div>

        {/* iOS ホームバー用スペース */}
        <div style={{ height: 'env(safe-area-inset-bottom)', flexShrink: 0 }} />
      </div>
    </div>
  );
}
