'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, Car, Wrench } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import Modal from '@/components/Modal';
import { SkeletonList } from '@/components/Skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';

type Garage = {
  id: number;
  number: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  monthly_fee: number;
  notes: string;
  contractor_name?: string;
};

// ステータスをカード全体で色分け（高齢者でも一目でわかるように）
const STATUS_CONFIG = {
  vacant: {
    label: '空き',
    cardClass: 'border-emerald-400 bg-emerald-50',
    badgeClass: 'bg-emerald-500 text-white',
  },
  occupied: {
    label: '使用中',
    cardClass: 'border-slate-300 bg-white',
    badgeClass: 'bg-slate-500 text-white',
  },
  maintenance: {
    label: '整備中',
    cardClass: 'border-amber-400 bg-amber-50',
    badgeClass: 'bg-amber-500 text-white',
  },
};

const inputCls = 'border border-slate-300 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white text-base';

export default function GaragesPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Garage | null>(null);
  const [form, setForm] = useState({ number: '', status: 'vacant', monthly_fee: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; number: string } | null>(null);
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
    setToast({ message: editTarget ? '更新しました' : '区画を追加しました', kind: 'success' });
    load();
  };

  const remove = (id: number) => {
    const target = garages.find(g => g.id === id);
    if (target) setDeleteTarget({ id, number: target.number });
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

  const vacant = garages.filter(g => g.status === 'vacant').length;
  const occupied = garages.filter(g => g.status === 'occupied').length;

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">駐車区画</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            空き <span className="font-bold text-emerald-600">{vacant}</span> 区画　／
            使用中 <span className="font-bold text-slate-700">{occupied}</span> 区画
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-700 shadow-sm text-base"
        >
          <Plus size={18} /> 区画を追加
        </button>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`${deleteTarget.number}番区画を削除`}
          message="削除すると元に戻せません。"
          confirmLabel="削除する"
          onConfirm={confirmRemove}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {dataLoading ? (
        <SkeletonList count={4} />
      ) : garages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Car size={30} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-700 text-lg mb-2">区画が登録されていません</p>
          <p className="text-sm text-slate-400 mb-6">まず「区画を追加」から<br />駐車スペースを登録してください</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold text-base hover:bg-slate-700"
          >
            <Plus size={18} /> 区画を追加する
          </button>
        </div>
      ) : (
        /* 1列リスト — 1枚ずつ大きく、見やすく */
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
          {garages.map(g => {
            const cfg = STATUS_CONFIG[g.status];
            return (
              <div
                key={g.id}
                className={`rounded-2xl border-2 shadow-sm overflow-hidden ${cfg.cardClass}`}
              >
                {/* カード上部：番号とステータス */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-slate-900 leading-none tabular-nums">
                      {g.number}
                    </span>
                    <span className="text-sm text-slate-500 font-medium mt-1">番区画</span>
                  </div>
                  <span className={`text-sm px-4 py-1.5 rounded-full font-bold ${cfg.badgeClass}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* 契約者名 */}
                <div className="px-4 pb-3">
                  {g.contractor_name ? (
                    <p className="text-lg font-bold text-slate-800">{g.contractor_name} さん</p>
                  ) : (
                    g.status === 'vacant'
                      ? <p className="text-base text-emerald-600 font-medium">入居者募集中</p>
                      : g.status === 'maintenance'
                      ? <p className="text-base text-amber-600 font-medium flex items-center gap-1"><Wrench size={15} /> 整備・点検中</p>
                      : null
                  )}
                  {g.monthly_fee > 0 && (
                    <p className="text-base text-slate-600 mt-1">
                      月額 <span className="font-bold text-slate-900">¥{g.monthly_fee.toLocaleString()}</span>
                    </p>
                  )}
                  {g.notes && (
                    <p className="text-sm text-slate-500 mt-1">{g.notes}</p>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="flex border-t border-slate-100 divide-x divide-slate-100 bg-white/60">
                  <button
                    onClick={() => openEdit(g)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-slate-600 font-medium text-sm hover:bg-slate-100 active:bg-slate-200"
                  >
                    <Pencil size={15} /> 編集する
                  </button>
                  <button
                    onClick={() => remove(g.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-red-500 font-medium text-sm hover:bg-red-50 active:bg-red-100"
                  >
                    <Trash2 size={15} /> 削除する
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 区画追加・編集モーダル */}
      {showForm && (
        <Modal title={editTarget ? `${editTarget.number}番区画を編集` : '新しい区画を追加'} onClose={() => setShowForm(false)}>
          {/* 区画番号 */}
          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">
              区画番号 <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={form.number}
              onChange={e => setForm({ ...form, number: e.target.value })}
              placeholder="例: 1"
              disabled={!!editTarget}
            />
          </div>

          {/* ステータス */}
          {editTarget?.contractor_name ? (
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">ステータス</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-500 text-base">
                使用中（契約者がいるため変更できません）
              </div>
            </div>
          ) : (
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">ステータス</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="vacant">空き（使用可能）</option>
                <option value="maintenance">整備中（使用不可）</option>
              </select>
            </div>
          )}

          {/* 月額料金 */}
          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">月額料金（円）</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-medium">¥</span>
              <input
                className={`${inputCls} pl-8`}
                type="number"
                inputMode="numeric"
                value={form.monthly_fee}
                onChange={e => setForm({ ...form, monthly_fee: e.target.value })}
                placeholder="例: 10000"
                min="0"
              />
            </div>
          </div>

          {/* 備考 */}
          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">
              メモ（任意）
            </label>
            <input
              className={inputCls}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="例: 角地・屋根あり"
            />
          </div>

          <button
            onClick={save}
            disabled={loading || !form.number}
            className="w-full bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ minHeight: '56px', fontSize: '16px' }}
          >
            <Check size={20} /> {editTarget ? '保存する' : '追加する'}
          </button>
        </Modal>
      )}
    </div>
  );
}
