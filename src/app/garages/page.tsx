'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, Car, List } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import Modal from '@/components/Modal';
import { SkeletonList } from '@/components/Skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';
import { getCached, setCached } from '@/lib/page-cache';

type Garage = {
  id: number;
  number: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  monthly_fee: number;
  notes: string;
  contractor_name?: string;
};

const STATUS_CONFIG = {
  vacant:      { label: '空き',   cardClass: 'border-emerald-300 bg-emerald-50', badgeClass: 'bg-emerald-500 text-white' },
  occupied:    { label: '使用中', cardClass: 'border-slate-200  bg-white',       badgeClass: 'bg-slate-500  text-white' },
  maintenance: { label: '整備中', cardClass: 'border-amber-300  bg-amber-50',    badgeClass: 'bg-amber-500  text-white' },
};

const inputCls = 'border border-slate-300 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white text-base';

export default function GaragesPage() {
  const [garages,     setGarages]     = useState<Garage[]>([]);
  const [showForm,    setShowForm]    = useState(false);
  const [showBulk,    setShowBulk]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<Garage | null>(null);
  const [form,        setForm]        = useState({ number: '', status: 'vacant', monthly_fee: '', notes: '' });
  const [bulk,        setBulk]        = useState({ start: '1', end: '10', monthly_fee: '', notes: '' });
  const [loading,     setLoading]     = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; number: string } | null>(null);
  const [toast,       setToast]       = useState<ToastType | null>(null);

  const load = useCallback(async () => {
    // キャッシュがあれば即座に表示（スケルトンなし）
    const cached = getCached<Garage[]>('garages');
    if (cached) { setGarages(cached); setDataLoading(false); }
    else setDataLoading(true);

    // 常にバックグラウンドで最新データを取得
    const res  = await fetch('/api/garages');
    const json = await res.json().catch(() => []);
    const data = Array.isArray(json) ? json : [];
    setCached('garages', data);
    setGarages(data);
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
      number: form.number,
      monthly_fee: Number(form.monthly_fee) || 0,
      notes: form.notes,
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
    if (editTarget) {
      setGarages(prev => prev.map(g =>
        g.id === editTarget.id
          ? { ...g, status: body.status as Garage['status'], monthly_fee: body.monthly_fee, notes: body.notes }
          : g
      ));
    } else {
      load();
    }
  };

  // まとめて追加のプレビュー
  const bulkStart  = Math.floor(Number(bulk.start));
  const bulkEnd    = Math.floor(Number(bulk.end));
  const bulkCount  = (Number.isFinite(bulkStart) && Number.isFinite(bulkEnd) && bulkEnd >= bulkStart)
    ? bulkEnd - bulkStart + 1 : 0;
  const bulkValid  = bulkCount >= 1 && bulkCount <= 100 && bulkStart >= 1;

  const saveBulk = async () => {
    setLoading(true);
    const res = await fetch('/api/garages/bulk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        start:       bulkStart,
        end:         bulkEnd,
        monthly_fee: Number(bulk.monthly_fee) || 0,
        notes:       bulk.notes,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ message: d.error ?? '追加に失敗しました', kind: 'error' });
      return;
    }
    const d = await res.json();
    setShowBulk(false);
    setBulk({ start: '1', end: '10', monthly_fee: '', notes: '' });
    const msg = d.skipped > 0
      ? `${d.added}区画を追加しました（${d.skipped}区画は既に存在するためスキップ）`
      : `${d.added}区画を追加しました`;
    setToast({ message: msg, kind: 'success' });
    load();
  };

  const remove = (id: number) => {
    const target = garages.find(g => g.id === id);
    if (target) setDeleteTarget({ id, number: target.number });
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/garages/${deleteTarget.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      setDeleteTarget(null);
      setToast({ message: d.error ?? '削除に失敗しました', kind: 'error' });
      return;
    }
    setGarages(prev => prev.filter(g => g.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast({ message: '削除しました', kind: 'success' });
  };

  const vacant  = garages.filter(g => g.status === 'vacant').length;
  const occupied = garages.filter(g => g.status === 'occupied').length;

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">駐車区画</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            空き <span className="font-bold text-emerald-600">{vacant}</span>　使用中 <span className="font-bold text-slate-700">{occupied}</span>　全 {garages.length} 区画
          </p>
        </div>
        <div className="flex gap-2">
          {garages.length === 0 && (
            <button
              onClick={() => setShowBulk(true)}
              className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-sm text-base"
            >
              <List size={18} /> まとめて追加
            </button>
          )}
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-700 shadow-sm text-base"
          >
            <Plus size={18} /> 1件追加
          </button>
        </div>
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
          <p className="text-sm text-slate-400 mb-6">複数まとめて登録するか、1件ずつ追加できます</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowBulk(true)}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold text-base hover:bg-emerald-700"
            >
              <List size={18} /> まとめて追加する
            </button>
            <button
              onClick={openNew}
              className="inline-flex items-center justify-center gap-2 bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold text-base hover:bg-slate-700"
            >
              <Plus size={18} /> 1件だけ追加する
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 区画がある場合もまとめて追加ボタンを下部に表示 */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowBulk(true)}
              className="flex items-center gap-1.5 text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              <List size={15} /> まとめて追加
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
            {garages.map(g => {
              const cfg = STATUS_CONFIG[g.status];
              return (
                <div key={g.id} className={`rounded-2xl border-2 shadow-sm overflow-hidden ${cfg.cardClass}`}>
                  <div className="flex items-center justify-between px-4 py-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl font-black text-slate-900 tabular-nums shrink-0">{g.number}番</span>
                      {g.contractor_name && (
                        <span className="font-bold text-slate-800 text-base truncate">{g.contractor_name} さん</span>
                      )}
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-bold shrink-0 ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {(g.monthly_fee > 0 || g.notes) && (
                    <div className="px-4 pb-2.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      {g.monthly_fee > 0 && (
                        <span className="text-sm text-slate-600">
                          月額 <span className="font-bold text-slate-800">¥{g.monthly_fee.toLocaleString()}</span>
                        </span>
                      )}
                      {g.notes && <span className="text-sm text-slate-400">{g.notes}</span>}
                    </div>
                  )}

                  <div className="flex border-t border-slate-100 divide-x divide-slate-100 bg-white/60">
                    <button
                      onClick={() => openEdit(g)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-slate-600 font-medium text-sm hover:bg-slate-100"
                    >
                      <Pencil size={14} /> 編集する
                    </button>
                    <button
                      onClick={() => remove(g.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-red-500 font-medium text-sm hover:bg-red-50"
                    >
                      <Trash2 size={14} /> 削除する
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 1件追加・編集モーダル */}
      {showForm && (
        <Modal title={editTarget ? `${editTarget.number}番区画を編集` : '新しい区画を追加'} onClose={() => setShowForm(false)}>
          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">区画番号 <span className="text-red-500">*</span></label>
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
              <label className="text-base font-bold text-slate-700 mb-2 block">ステータス</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-500 text-base">
                使用中（契約者がいるため変更できません）
              </div>
            </div>
          ) : (
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">ステータス</label>
              <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="vacant">空き（使用可能）</option>
                <option value="maintenance">整備中（使用不可）</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">月額料金（円）</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
              <input
                className={`${inputCls} pl-8`}
                type="number" inputMode="numeric"
                value={form.monthly_fee}
                onChange={e => setForm({ ...form, monthly_fee: e.target.value })}
                placeholder="例: 10000" min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">メモ（任意）</label>
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
            className="w-full bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ minHeight: '56px', fontSize: '16px' }}
          >
            <Check size={20} /> {editTarget ? '保存する' : '追加する'}
          </button>
        </Modal>
      )}

      {/* まとめて追加モーダル */}
      {showBulk && (
        <Modal title="区画をまとめて追加" onClose={() => setShowBulk(false)}>
          {/* プレビューバナー */}
          <div className={`rounded-xl px-4 py-3 text-center font-bold text-base ${
            bulkValid
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-slate-50 border border-slate-200 text-slate-400'
          }`}>
            {bulkValid
              ? `${bulkStart}番〜${bulkEnd}番（${bulkCount}区画）を追加します`
              : '番号の範囲を入力してください'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">開始番号 <span className="text-red-500">*</span></label>
              <input
                className={inputCls}
                type="number" inputMode="numeric"
                value={bulk.start}
                onChange={e => setBulk({ ...bulk, start: e.target.value })}
                placeholder="1" min="1"
              />
            </div>
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">終了番号 <span className="text-red-500">*</span></label>
              <input
                className={inputCls}
                type="number" inputMode="numeric"
                value={bulk.end}
                onChange={e => setBulk({ ...bulk, end: e.target.value })}
                placeholder="20" min="1"
              />
            </div>
          </div>

          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">月額料金（全区画共通・円）</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
              <input
                className={`${inputCls} pl-8`}
                type="number" inputMode="numeric"
                value={bulk.monthly_fee}
                onChange={e => setBulk({ ...bulk, monthly_fee: e.target.value })}
                placeholder="例: 10000（後から変更可）" min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">メモ（任意・全区画共通）</label>
            <input
              className={inputCls}
              value={bulk.notes}
              onChange={e => setBulk({ ...bulk, notes: e.target.value })}
              placeholder="例: 月極駐車場"
            />
          </div>

          <p className="text-sm text-slate-400">※ すでに存在する番号は自動的にスキップされます</p>

          <button
            onClick={saveBulk}
            disabled={loading || !bulkValid}
            className="w-full bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ minHeight: '56px', fontSize: '16px' }}
          >
            {loading ? '追加中...' : (
              <><Check size={20} /> {bulkValid ? `${bulkCount}区画をまとめて追加する` : '追加する'}</>
            )}
          </button>
        </Modal>
      )}
    </div>
  );
}
