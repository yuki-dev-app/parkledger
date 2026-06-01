'use client';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrintButton() {
  const router = useRouter();
  return (
    <div className="no-print fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3 justify-center">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-medium hover:bg-slate-200 active:bg-slate-300"
      >
        <ArrowLeft size={18} /> 戻る
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 active:bg-slate-900 shadow"
      >
        <Printer size={18} /> 印刷 / PDF保存
      </button>
    </div>
  );
}
