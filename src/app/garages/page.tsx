'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import Modal from '@/components/Modal';

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
  vacant: 'bg-emerald-100 text-emerald-700',
  occupied: 'bg-slate-200 text-slate-600',
  maintenance: 'bg-amber-100 text-amber-700',
};

const inputCls = 'border border-slate-300 rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white';

export default function GaragesPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Garage | null>(null);
  const [form, setForm] = useState({ number: '', status: 'vacant', monthly_fee: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/garages');
    setGarages(await res.json());
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
    if (!confirm('この区画を削除しますか？')) return;
    const res = await fetch(`/api/garages/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      setToast({ message: d.error ?? '削除に失敗しました', kind: 'error' });
      return;
    }
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  const vacantCount = garages.filter(g => g.status === 'vacant').length;

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">空き状況</h2>
          <p className="text-sm text-slate-500">
            空き <span className="font-bold text-emerald-600">{vacantCount}</span> / {garages.length} 区画
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-slate-700 active:bg-slate-900 shadow-sm shrink-0"
          style={{ minHeight: '44px' }}
        >
          <Plus size={18} /> 区画追加
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {garages.map(g => (
          <div key={g.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-slate-900 text-base">#{g.number}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[g.status]}`}>
                {STATUS_LABEL[g.status]}
              </span>
            </div>
            {g.contractor_name && <p className="text-sm text-slate-700 font-medium truncate">{g.contractor_name}</p>}
            <p className="text-sm text-slate-500">¥{g.monthly_fee.toLocaleString()}/月</p>
            {g.notes && <p className="text-xs text-slate-400 line-clamp-1">{g.notes}</p>}
            <div className="flex gap-1 mt-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => openEdit(g)}
                className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-800 py-2 rounded-lg hover:bg-slate-100"
                style={{ minHeight: '36px' }}
              >
                <Pencil size={13} /> 編集
              </button>
              <button
                onClick={() => remove(g.id, g.status)}
                className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-red-500 py-2 rounded-lg hover:bg-red-50"
                style={{ minHeight: '36px' }}
              >
                <Trash2 size={13} /> 削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editTarget ? '区画を編集' : '区画を追加'} onClose={() => setShowForm(false)}>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">区画番号 *</label>
            <input
              className={inputCls}
              style={{ fontSize: '16px' }}
              value={form.number}
              onChange={e => setForm({ ...form, number: e.target.value })}
              placeholder="例: 1"
              disabled={!!editTarget}
            />
          </div>
          {editTarget?.contractor_name ? (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">ステータス</label>
              <div className={`${inputCls} bg-slate-50 text-slate-500`} style={{ fontSize: '16px' }}>
                使用中（契約者がいるため変更不可）
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">ステータス</label>
              <select className={inputCls} style={{ fontSize: '16px' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="vacant">空き</option>
                <option value="maintenance">整備中</option>
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">月額料金</label>
            <select className={inputCls} style={{ fontSize: '16px' }} value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value })}>
              <option value="">選択してください</option>
              <option value="9000">¥9,000</option>
              <option value="10000">¥10,000</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">備考</label>
            <input className={inputCls} style={{ fontSize: '16px' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="例: 角地、屋根あり" />
          </div>
          <button
            onClick={save}
            disabled={loading || !form.number}
            className="w-full bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ minHeight: '52px', fontSize: '16px' }}
          >
            <Check size={18} /> {editTarget ? '保存する' : '追加する'}
          </button>
        </Modal>
      )}
    </div>
  );
}
