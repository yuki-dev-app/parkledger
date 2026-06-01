'use client';
import { Printer, ArrowLeft, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  hint?: string; // 書類別のヒント（例：「印鑑を押してからお渡しください」）
};

export default function PrintButton({ hint }: Props) {
  const router = useRouter();

  // iOS Safari かどうか判定
  const isIOS = typeof navigator !== 'undefined' && /iP(hone|ad)/.test(navigator.userAgent);

  return (
    <div className="no-print fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ヒント表示 */}
      {hint && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <span className="text-lg">💡</span>
          <p className="text-sm text-amber-800 font-medium">{hint}</p>
        </div>
      )}

      {/* iOS向け案内 */}
      {isIOS && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
          <Share2 size={15} className="text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">
            iPhoneの場合：下の「印刷」ボタンを押すか、
            <strong>画面下の共有ボタン（□↑）→「プリント」</strong>でも印刷できます
          </p>
        </div>
      )}

      <div className="flex gap-3 p-4 max-w-lg mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-3.5 rounded-xl font-medium hover:bg-slate-200 active:bg-slate-300 text-base"
        >
          <ArrowLeft size={18} /> 戻る
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-700 active:bg-slate-900 shadow text-base"
        >
          <Printer size={20} /> 印刷 / PDF保存
        </button>
      </div>
    </div>
  );
}
