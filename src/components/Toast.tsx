'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = { message: string; kind: 'success' | 'error' };

export default function Toast({ toast, onClose }: { toast: ToastType | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) { setVisible(false); return; }
    // 次のフレームで表示してCSSアニメーションを起動
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 250); // フェードアウト後に破棄
    }, 3000);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); };
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.kind === 'error';

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 72px)', // 下部ナビ(56px)より上
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
      }}
    >
      <div
        className={`
          pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl
          text-white text-sm font-medium max-w-sm w-full
          transition-all duration-200
          ${isError
            ? 'bg-red-600 shadow-red-900/30'
            : 'bg-slate-800 shadow-slate-900/40'
          }
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
        style={{
          border: isError
            ? '1px solid rgba(239,68,68,0.3)'
            : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span className="shrink-0">
          {isError
            ? <AlertCircle size={17} className="text-red-300" />
            : <CheckCircle2 size={17} className="text-emerald-400" />
          }
        </span>
        <span className="flex-1 leading-snug">{toast.message}</span>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 200); }}
          className="shrink-0 text-white/50 hover:text-white transition-colors p-0.5"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
