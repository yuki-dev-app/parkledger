'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Check, Phone, Mail, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';

type Inquiry = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  created_at: string;
  notes: string;
};

const STATUS_LABEL = { new: '新着', in_progress: '対応中', resolved: '解決済' };
const STATUS_COLOR = {
  new: 'bg-amber-50 text-amber-700 border border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  resolved: 'bg-slate-100 text-slate-500 border border-slate-200',
};

const emptyForm = { name: '', phone: '', email: '', message: '' };

const inputCls = 'border border-slate-300 rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<{ [id: number]: string }>({});
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [toast, setToast] = useState<ToastType | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/inquiries');
    setInquiries(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setLoading(true);
    const res = await fetch('/api/inquiries', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) { setToast({ message: '保存に失敗しました', kind: 'error' }); return; }
    setShowForm(false);
    setForm(emptyForm);
    setToast({ message: '問い合わせを追加しました', kind: 'success' });
    load();
  };

  const updateStatus = async (id: number, status: string, notes: string) => {
    const res = await fetch(`/api/inquiries/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) { setToast({ message: '更新に失敗しました', kind: 'error' }); return; }
    setToast({ message: '更新しました', kind: 'success' });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  const filtered = inquiries.filter(i => filter === 'all' || i.status === filter);
  const newCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">問い合わせ</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {newCount > 0 && <span className="text-amber-600 font-medium">新着 {newCount} 件 · </span>}
            全 {inquiries.length} 件
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm); }}
          className="flex items-center gap-1.5 bg-slate-800 text-white px-3.5 py-2 rounded-xl font-medium hover:bg-slate-700 shadow-sm text-sm"
        >
          <Plus size={15} /> 追加
        </button>
      </div>

      {/* フィルターチップ */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
        {(['all', 'new', 'in_progress', 'resolved'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
              filter === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {s === 'all' ? 'すべて' : STATUS_LABEL[s]}
            {s !== 'all' && (
              <span className="ml-1 opacity-70">
                {inquiries.filter(i => i.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">
              {filter === 'all' ? '問い合わせがありません' : `${STATUS_LABEL[filter as keyof typeof STATUS_LABEL]}の問い合わせはありません`}
            </p>
            {filter === 'all' && (
              <>
                <p className="text-sm text-slate-400 mb-5">見込み客からの問い合わせを記録できます</p>
                <button
                  onClick={() => { setShowForm(true); setForm(emptyForm); }}
                  className="inline-flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-700"
                >
                  <Plus size={15} /> 問い合わせを追加
                </button>
              </>
            )}
          </div>
        )}

        {filtered.map(inq => {
          const isOpen = expanded === inq.id;
          const notes = editNotes[inq.id] ?? inq.notes;
          return (
            <div key={inq.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div
                className="p-3.5 flex items-start justify-between cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : inq.id)}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[inq.status]}`}>
                      {STATUS_LABEL[inq.status]}
                    </span>
                    <span className="font-bold text-slate-900 text-sm truncate">{inq.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{inq.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{inq.created_at.slice(0, 10)}</p>
                </div>
                <div className="text-slate-400 shrink-0">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 px-3.5 pb-3.5">
                  <div className="pt-3 flex flex-col gap-2.5">
                    <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed">
                      {inq.message}
                    </p>
                    {inq.phone && (
                      <a href={`tel:${inq.phone}`} className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium">
                        <Phone size={14} />{inq.phone}
                      </a>
                    )}
                    {inq.email && (
                      <a href={`mailto:${inq.email}`} className="inline-flex items-center gap-1.5 text-xs text-blue-600">
                        <Mail size={13} />{inq.email}
                      </a>
                    )}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block font-medium">対応メモ</label>
                      <textarea
                        className={inputCls}
                        style={{ fontSize: '14px' }}
                        rows={2}
                        value={notes}
                        onChange={e => setEditNotes({ ...editNotes, [inq.id]: e.target.value })}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {inq.status !== 'in_progress' && (
                        <button
                          onClick={() => updateStatus(inq.id, 'in_progress', notes)}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg font-medium hover:bg-blue-100"
                        >
                          対応中にする
                        </button>
                      )}
                      {inq.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(inq.id, 'resolved', notes)}
                          className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg font-medium hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <Check size={12} /> 解決済にする
                        </button>
                      )}
                      {inq.status !== 'new' && (
                        <button
                          onClick={() => updateStatus(inq.id, 'new', notes)}
                          className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded-lg font-medium hover:bg-amber-100"
                        >
                          新着に戻す
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(inq.id, inq.status, notes)}
                        className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-lg font-medium hover:bg-slate-200"
                      >
                        メモ保存
                      </button>
                      <button
                        onClick={() => remove(inq.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-2 ml-auto"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:mx-4 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">問い合わせを追加</h3>
              <button onClick={() => setShowForm(false)} className="flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 w-10 h-10"><X size={19} /></button>
            </div>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">氏名 *</label>
                <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="田中 太郎" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">電話番号</label>
                <input className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" placeholder="090-0000-0000" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">メール</label>
                <input className={inputCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="example@mail.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">問い合わせ内容 *</label>
                <textarea className={inputCls} rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <button
                onClick={save}
                disabled={loading || !form.name || !form.message}
                className="bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 disabled:opacity-50"
                style={{ fontSize: '16px' }}
              >
                <Check size={17} /> 追加する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
