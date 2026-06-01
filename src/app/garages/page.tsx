'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, Car } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import Modal from '@/components/Modal';
import { SkeletonGrid } from '@/components/Skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';

type Garage = {
  id: number;
  number: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  monthly_fee: number;
  notes: string;
  contractor_name?: string;
};

const STATUS_LABEL = { vacant: '空き', occupied: '使用中', maintenance: '整備中' };
const STATUS_COLOR = {
  vacant: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  occupied: 'bg-slate-100 text-slate-600 border border-slate-200',
  maintenance: 'bg-amber-100 text-amber-700 border border-amber-200',
};

const inputCls = 'border border-slate-300 rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white';

export default function GaragesPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Garage | null>(null);
  const [form, setForm] = useState({ number: '', status: 'vacant', monthly_fee: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; number: string; status: string } | null>(null);
  const [toast, setToast] = useState<ToastType | null>(null);

  const load = useCallback(async () => {
    setDataLoading(true);
    const res = await fetch('/api/garages');
    setGarages(await res.json());
    setDataLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ number: '', status: 'vacant', monthly_fee: '', notes: '' });
    setEditTarget(null);
    setShowForm(true);
  };

  const openEdit = (g: Garage) => {
    setForm({ number: g.number, status: g.status, monthly_fee: String(g.monthly_fee), notes: g.notes });
    setEditTarget(g);
    setShowForm(true);
  };

  const save = async () => {
    setLoading(true);
    const body = {
      ...form,
      monthly_fee: Number(form.monthly_fee) || 0,
      status: editTarget?.contractor_name ? 'occupied' : form.status,
    };
    const res = editTarget
      ? await fetch(`/api/garages/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/garages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setToast({ message: d.error ?? '保存に失敗しました', kind: 'error' });
      return;
    }
    setShowForm(false);
    setToast({ message: editTarget ? '更新しました' : '追加しました', kind: 'success' });
    load();
  };

  const remove = async (id: number, status: string) => {
    if (status === 'occupied') {
      setToast({ message: '使用中の区画は削除できません', kind: 'error' });
      return;
    }
    setDeleteTarget(garages.find(g => g.id === id) ? { id, number: garages.find(g => g.id === id)!.number, status } : null);
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/garages/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    if (!res.ok) {
      const d = await res.json();
      setToast({ message: d.error ?? '削除に失敗しました', kind: 'error' });
      return;
    }
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  const vacantCount = garages.filter(g => g.status === 'vacant').length;
  const occupiedCount = garages.filter(g => g.status === 'occupied').length;

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">空き状況</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            空き <span className="font-semibold text-emerald-600">{vacantCount}</span>
            <span className="mx-1">·</span>
            使用中 <span className="font-semibold text-slate-600">{occupiedCount}</span>
            <span className="mx-1">·</span>
            全 {garages.length} 区画
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-slate-800 text-white px-3.5 py-2 rounded-xl font-medium hover:bg-slate-700 active:bg-slate-900 shadow-sm text-sm"
        >
          <Plus size={15} /> 区画追加
        </button>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`区画 #${deleteTarget.number} を削除`}
          message="この区画を削除すると元に戻せません。"
          confirmLabel="削除する"
          onConfirm={confirmRemove}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {dataLoading ? (
        <SkeletonGrid count={6} />
      ) : garages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Car size={28} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">区画が登録されていません</p>
          <p className="text-sm text-slate-400 mb-5">「区画追加」から駐車区画を登録してください</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-700"
          >
            <Plus size={15} /> 最初の区画を追加
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {garages.map(g => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col gap-1.5"
              style={{ minHeight: '110px' }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 text-base">#{g.number}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[g.status]}`}>
                  {STATUS_LABEL[g.status]}
                </span>
              </div>
              {g.contractor_name
                ? <p className="text-sm text-slate-700 font-medium truncate flex-1">{g.contractor_name}</p>
                : <p className="text-xs text-slate-300 flex-1">—</p>
              }
              <p className="text-xs text-slate-400">¥{g.monthly_fee.toLocaleString()}/月</p>
              {g.notes && <p className="text-[11px] text-slate-400 line-clamp-1">{g.notes}</p>}
              <div className="flex gap-1 pt-1 border-t border-slate-100 mt-auto">
                <button
                  onClick={() => openEdit(g)}
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  <Pencil size={12} /> 編集
                </button>
                <button
                  onClick={() => remove(g.id, g.status)}
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-red-500 py-1.5 rounded-lg hover:bg-red-50"
                  disabled={g.status === 'occupied'}
                >
                  <Trash2 size={12} /> 削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editTarget ? '区画を編集' : '区画を追加'} onClose={() => setShowForm(false)}>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">区画番号 *</label>
            <input
              className={inputCls}
              value={form.number}
              onChange={e => setForm({ ...form, number: e.target.value })}
              placeholder="例: 1"
              disabled={!!editTarget}
            />
          </div>
          {editTarget?.contractor_name ? (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">ステータス</label>
              <div className={`${inputCls} bg-slate-50 text-slate-500`}>
                使用中（契約者がいるため変更不可）
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">ステータス</label>
              <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="vacant">空き</option>
                <option value="maintenance">整備中</option>
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">月額料金（円）</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
              <input
                className={`${inputCls} pl-7`}
                type="number"
                inputMode="numeric"
                value={form.monthly_fee}
                onChange={e => setForm({ ...form, monthly_fee: e.target.value })}
                placeholder="例: 10000"
                min="0"
                step="500"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">備考</label>
            <input className={inputCls} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="例: 角地、屋根あり" />
          </div>
          <button
            onClick={save}
            disabled={loading || !form.number}
            className="w-full bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ minHeight: '48px', fontSize: '16px' }}
          >
            <Check size={17} /> {editTarget ? '保存する' : '追加する'}
          </button>
        </Modal>
      )}
    </div>
  );
}
