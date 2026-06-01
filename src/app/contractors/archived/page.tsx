'use client';
import { useEffect, useState, useCallback } from 'react';
import { RotateCcw, Trash2, ChevronLeft, Car, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/Toast';

type ArchivedContractor = {
  id: number;
  name: string;
  phone: string;
  address: string;
  vehicle_type: string;
  vehicle_number: string;
  monthly_fee: number;
  garage_number: string;
  contract_start: string;
  contract_end: string;
  archived_at: string;
  archive_reason: string;
};

export default function ArchivedContractorsPage() {
  const [list, setList] = useState<ArchivedContractor[]>([]);
  const [toast, setToast] = useState<ToastType | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/contractors?archived=1');
    setList(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async (id: number, name: string) => {
    if (!confirm(`${name} さんを現役契約者に復元しますか？\n区画が「使用中」に戻ります。`)) return;
    const res = await fetch(`/api/contractors/${id}/archive`, { method: 'DELETE' });
    if (!res.ok) { setToast({ message: '復元に失敗しました', kind: 'error' }); return; }
    setToast({ message: '復元しました', kind: 'success' });
    load();
  };

  const permanentDelete = async (id: number, name: string) => {
    if (!confirm(`${name} さんのデータを完全に削除しますか？\nこの操作は元に戻せません。`)) return;
    const res = await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
    if (!res.ok) { setToast({ message: '削除に失敗しました', kind: 'error' }); return; }
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex items-center gap-3 mb-5">
        <Link href="/contractors"
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100">
          <ChevronLeft size={16} /> 契約者一覧に戻る
        </Link>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-900">解約者履歴</h2>
        <p className="text-base text-slate-500">{list.length} 件　解約後も記録を保持しています</p>
      </div>

      {list.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-base">解約者の記録はありません</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {list.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold shrink-0">
                    #{c.garage_number}
                  </span>
                  <span className="font-bold text-slate-900 text-lg">{c.name}</span>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                    解約済
                  </span>
                </div>

                <div className="text-sm text-slate-500 space-y-0.5">
                  <p>契約期間: {c.contract_start} 〜 {c.contract_end || '未定'}</p>
                  <p>解約日: <span className="font-medium text-slate-700">{c.archived_at}</span></p>
                  {c.archive_reason && (
                    <p>解約理由: {c.archive_reason}</p>
                  )}
                  <p>月額: ¥{c.monthly_fee?.toLocaleString()}</p>
                  {c.vehicle_type && (
                    <p className="flex items-center gap-1"><Car size={12} />{c.vehicle_type}　{c.vehicle_number}</p>
                  )}
                  {c.address && (
                    <p className="flex items-center gap-1"><MapPin size={12} />{c.address}</p>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-blue-700">
                      <Phone size={12} />{c.phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 ml-3 shrink-0">
                <button
                  onClick={() => restore(c.id, c.name)}
                  className="flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl font-medium hover:bg-emerald-100 active:bg-emerald-200"
                >
                  <RotateCcw size={14} /> 復元
                </button>
                <button
                  onClick={() => permanentDelete(c.id, c.name)}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50"
                >
                  <Trash2 size={14} /> 完全削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
