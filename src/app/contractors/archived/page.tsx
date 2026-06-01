'use client';
import { useEffect, useState, useCallback } from 'react';
import { RotateCcw, Trash2, ChevronLeft, Car, MapPin, Phone, Archive } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonList } from '@/components/Skeleton';
import { useScrollLock } from '@/lib/use-scroll-lock';

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

function fmt(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${y}年${Number(m)}月${Number(day)}日`;
}

export default function ArchivedContractorsPage() {
  const [list,          setList]          = useState<ArchivedContractor[]>([]);
  const [dataLoading,   setDataLoading]   = useState(true);
  const [toast,         setToast]         = useState<ToastType | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<{ id: number; name: string } | null>(null);

  useScrollLock(!!restoreTarget || !!deleteTarget);

  const load = useCallback(async () => {
    setDataLoading(true);
    const res = await fetch('/api/contractors?archived=1');
    setList(await res.json());
    setDataLoading(false);
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

      {/* 戻るボタン */}
      <div className="mb-4">
        <Link
          href="/contractors"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-base font-medium px-3 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200"
        >
          <ChevronLeft size={18} /> 契約者一覧に戻る
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">解約者の履歴</h1>
        <p className="text-sm text-slate-500 mt-0.5">全 {list.length} 件</p>
      </div>

      {dataLoading && <SkeletonList count={3} lines={2} />}

      {!dataLoading && list.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Archive size={26} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-700 text-lg mb-1">解約者の記録はありません</p>
          <p className="text-sm text-slate-400">解約処理をすると、ここに履歴が保存されます</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {list.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4">
              {/* 名前・区画・ステータス */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-sm bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold border border-slate-200 shrink-0">
                  {c.garage_number}番
                </span>
                <span className="font-bold text-slate-900 text-xl">{c.name} さん</span>
                <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-bold shrink-0">
                  解約済み
                </span>
              </div>

              {/* 詳細情報 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">解約日</p>
                  <p className="text-base font-bold text-slate-800">{fmt(c.archived_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">月額</p>
                  <p className="text-base font-bold text-slate-800">¥{c.monthly_fee?.toLocaleString()}</p>
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-2">
                契約期間：{fmt(c.contract_start)} 〜 {c.contract_end ? fmt(c.contract_end) : '未定'}
              </p>

              {c.archive_reason && (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mb-2">
                  解約理由：{c.archive_reason}
                </p>
              )}
              {c.vehicle_type && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-1">
                  <Car size={14} className="text-slate-400 shrink-0" />
                  {c.vehicle_type}　{c.vehicle_number}
                </p>
              )}
              {c.address && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-1">
                  <MapPin size={14} className="text-slate-400 shrink-0" />{c.address}
                </p>
              )}
              {c.phone && (
                <a href={`tel:${c.phone}`} className="text-sm text-blue-600 flex items-center gap-1.5 font-medium">
                  <Phone size={14} />{c.phone}
                </a>
              )}
            </div>

            {/* アクションボタン */}
            <div className="border-t border-slate-100 px-3 pb-3 pt-2 flex gap-2 bg-slate-50/60">
              <button
                onClick={() => setRestoreTarget({ id: c.id, name: c.name })}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 active:bg-emerald-800"
              >
                <RotateCcw size={15} /> 現役に戻す
              </button>
              <button
                onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                className="flex items-center justify-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 bg-white px-4 py-3 rounded-xl hover:bg-red-50 active:bg-red-100 font-medium"
              >
                <Trash2 size={15} /> 完全削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
