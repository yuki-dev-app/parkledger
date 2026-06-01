'use client';
import { useEffect, useState, useCallback } from 'react';
import { RotateCcw, Trash2, ChevronLeft, Car, MapPin, Phone, Archive } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

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
  const [restoreTarget, setRestoreTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/contractors?archived=1');
    setList(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async () => {
    if (!restoreTarget) return;
    const res = await fetch(`/api/contractors/${restoreTarget.id}/archive`, { method: 'DELETE' });
    setRestoreTarget(null);
    if (!res.ok) { setToast({ message: '復元に失敗しました', kind: 'error' }); return; }
    setToast({ message: '復元しました', kind: 'success' });
    load();
  };

  const permanentDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/contractors/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    if (!res.ok) { setToast({ message: '削除に失敗しました', kind: 'error' }); return; }
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {restoreTarget && (
        <ConfirmDialog
          title={`${restoreTarget.name} さんを復元`}
          message="現役契約者に戻します。区画が「使用中」に変わります。"
          confirmLabel="復元する"
          danger={false}
          onConfirm={restore}
          onCancel={() => setRestoreTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`${deleteTarget.name} さんを完全削除`}
          message="入金履歴も含め完全に削除されます。この操作は元に戻せません。"
          confirmLabel="完全に削除する"
          onConfirm={permanentDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/contractors"
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <ChevronLeft size={15} /> 契約者一覧
        </Link>
      </div>

      <div className="mb-3">
        <h1 className="text-lg font-bold text-slate-900">解約者履歴</h1>
        <p className="text-xs text-slate-400 mt-0.5">{list.length} 件</p>
      </div>

      {list.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Archive size={26} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">解約者の記録はありません</p>
          <p className="text-sm text-slate-400">解約処理をすると、ここに履歴が保存されます</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {list.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold border border-slate-200">
                      #{c.garage_number}
                    </span>
                    <span className="font-bold text-slate-900 text-base">{c.name}</span>
                    <span className="text-[11px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                      解約済
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">解約日</p>
                      <p className="text-sm font-medium text-slate-700">{c.archived_at}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">月額</p>
                      <p className="text-sm font-medium text-slate-700">¥{c.monthly_fee?.toLocaleString()}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">契約: {c.contract_start} 〜 {c.contract_end || '未定'}</p>
                  {c.archive_reason && (
                    <p className="text-xs text-slate-400 mt-1 bg-slate-50 rounded-lg px-2.5 py-1.5">解約理由: {c.archive_reason}</p>
                  )}
                  {c.vehicle_type && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Car size={11} className="text-slate-400" />{c.vehicle_type}　{c.vehicle_number}
                    </p>
                  )}
                  {c.address && (
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />{c.address}
                    </p>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                      <Phone size={11} />{c.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-3 py-2 flex gap-2 bg-slate-50/60">
              <button
                onClick={() => setRestoreTarget({ id: c.id, name: c.name })}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 rounded-lg font-medium text-xs hover:bg-emerald-700"
              >
                <RotateCcw size={13} /> 復元する
              </button>
              <button
                onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                className="flex items-center justify-center gap-1 text-xs text-red-400 hover:text-red-600 border border-red-200 bg-white px-3 py-2 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={13} /> 完全削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
