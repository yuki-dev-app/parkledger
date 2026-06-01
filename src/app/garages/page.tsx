'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';

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
    const body = { ...form, monthly_fee: Number(form.monthly_fee) || 0 };
    const res = editTarget
      ? await fetch(`/api/garages/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/garages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setToast({ message: data.error ?? '保存に失敗しました', kind: 'error' });
      return;
    }
    setShowForm(false);
    setToast({ message: editTarget ? '更新しました' : '区画を追加しました', kind: 'success' });
    load();
  };

  const remove = async (id: number, status: string) => {
    if (status === 'occupied') {
      setToast({ message: '使用中の区画は削除できません。先に契約者を削除してください。', kind: 'error' });
      return;
    }
    if (!confirm('この区画を削除しますか？')) return;
    const res = await fetch(`/api/garages/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      setToast({ message: data.error ?? '削除に失敗しました', kind: 'error' });
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
          <p className="text-base text-slate-500">空き <span className="font-bold text-emerald-600">{vacantCount}</span> / {garages.length} 区画</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-3 rounded-xl font-medium hover:bg-slate-700 active:bg-slate-900 shadow-sm">
          <Plus size={18} /> 区画追加
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {garages.map(g => (
          <div key={g.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-slate-900 text-lg">#{g.number}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[g.status]}`}>
                {STATUS_LABEL[g.status]}
              </span>
            </div>
            {g.contractor_name && <p className="text-sm text-slate-700 font-medium truncate">{g.contractor_name}</p>}
            <p className="text-sm text-slate-500">¥{g.monthly_fee.toLocaleString()}/月</p>
            {g.notes && <p className="text-xs text-slate-400 truncate">{g.notes}</p>}
            <div className="flex gap-1 mt-1">
              <button onClick={() => openEdit(g)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100">
                <Pencil size={15} /> 編集
              </button>
              <button onClick={() => remove(g.id, g.status)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50">
                <Trash2 size={15} /> 削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">{editTarget ? '区画を編集' : '区画を追加'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-700"><X size={22} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">区画番号 *</label>
                <input className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="例: 1" disabled={!!editTarget} />
              </div>
              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">ステータス</label>
                <select className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="vacant">空き</option>
                  <option value="occupied">使用中</option>
                  <option value="maintenance">整備中</option>
                </select>
              </div>
              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">月額料金</label>
                <select className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value })}>
                  <option value="">選択してください</option>
                  <option value="9000">¥9,000</option>
                  <option value="10000">¥10,000</option>
                </select>
              </div>
              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">備考</label>
                <input className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="例: 角地、屋根あり" />
              </div>
              <button onClick={save} disabled={loading || !form.number}
                className="bg-slate-800 text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50">
                <Check size={18} /> {editTarget ? '保存する' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
