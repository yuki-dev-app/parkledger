'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import { useCachedFetch } from '@/lib/use-cached-fetch';
import Toast, { ToastType } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';

type CleaningLog = {
  id: number;
  cleaned_date: string;
  person: string;
  notes: string;
  created_at: string;
};

const emptyForm = { cleaned_date: '', person: '', notes: '', personSelect: '' };

// 今日の日付を YYYY-MM-DD 形式で返す（日本時間）
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

export default function CleaningPage() {
  const { data: logs, reload: load } = useCachedFetch<CleaningLog[]>(
    'cleaning',
    async () => {
      const res  = await fetch('/api/cleaning');
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? json : [];
    },
    [],
  );

  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<CleaningLog | null>(null);
  const [form,         setForm]         = useState(emptyForm);
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState<ToastType | null>(null);
  const [persons,      setPersons]      = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; date: string } | null>(null);

  // 担当者リストは設定から取得（useCachedFetch と分離）
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .catch(() => ({}))
      .then((s: { cleaning_persons?: string }) => {
        setPersons(
          s.cleaning_persons
            ? s.cleaning_persons.split(',').map(p => p.trim()).filter(Boolean)
            : []
        );
      });
  }, []);

  const openNew = () => {
    setForm({ ...emptyForm, cleaned_date: today() });
    setEditTarget(null);
    setShowForm(true);
  };

  const openEdit = (log: CleaningLog) => {
    const isInList = persons.includes(log.person);
    setForm({
      cleaned_date: log.cleaned_date,
      person: log.person,
      personSelect: isInList ? log.person : '__other__',
      notes: log.notes,
    });
    setEditTarget(log);
    setShowForm(true);
  };

  const save = async () => {
    setLoading(true);
    const res = editTarget
      ? await fetch(`/api/cleaning/${editTarget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      : await fetch('/api/cleaning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      setToast({ message: d.error ?? '保存に失敗しました', kind: 'error' });
      return;
    }
    setShowForm(false);
    setToast({ message: editTarget ? '更新しました' : '清掃記録を追加しました', kind: 'success' });
    load();
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/cleaning/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    if (!res.ok) {
      setToast({ message: '削除に失敗しました。時間をおいて再度お試しください', kind: 'error' });
      return;
    }
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {deleteTarget && (
        <ConfirmDialog
          title={`${formatDate(deleteTarget.date)}の記録を削除`}
          message="この清掃記録を削除します。元に戻せません。"
          confirmLabel="削除する"
          onConfirm={remove}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">清掃記録</h1>
          <p className="text-sm text-slate-500 mt-0.5">全 {logs.length} 件</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-700 shadow-sm text-base"
        >
          <Plus size={18} /> 記録を追加
        </button>
      </div>

      {/* 記録一覧 */}
      <div className="flex flex-col gap-3">
        {logs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles size={26} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">清掃記録がありません</p>
            <p className="text-sm text-slate-400 mb-5">清掃した日付と担当者を記録できます</p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-700"
            >
              <Plus size={15} /> 最初の記録を追加
            </button>
          </div>
        )}

        {logs.map(log => (
          <div key={log.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                  <span className="font-bold text-slate-900 text-base whitespace-nowrap">{formatDate(log.cleaned_date)}</span>
                  <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium shrink-0">{log.person}</span>
                </div>
                {log.notes && (
                  <p className="text-sm text-slate-500 leading-relaxed mt-1 bg-slate-50 rounded-lg px-3 py-2">{log.notes}</p>
                )}
                <p className="text-xs text-slate-400 mt-1.5">登録: {log.created_at.slice(0, 10)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(log)}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 px-3 py-3 rounded-xl hover:bg-slate-100 active:bg-slate-200"
                >
                  <Pencil size={14} /> 編集
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: log.id, date: log.cleaned_date })}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 px-3 py-3 rounded-xl hover:bg-red-50 active:bg-red-100"
                >
                  <Trash2 size={14} /> 削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 入力フォーム（Modalコンポーネントで統一） */}
      {showForm && (
        <Modal
          title={editTarget ? '清掃記録を編集' : '清掃記録を追加'}
          onClose={() => setShowForm(false)}
        >
          <div>
            <label className="text-base text-slate-700 mb-1.5 block font-medium">清掃した日 *</label>
            <input
              type="date"
              className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
              value={form.cleaned_date}
              onChange={e => setForm({ ...form, cleaned_date: e.target.value })}
            />
          </div>

          <div>
            <label className="text-base text-slate-700 mb-1.5 block font-medium">担当者 *</label>
            {persons.length > 0 ? (
              <>
                <select
                  className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white"
                  style={{ fontSize: '16px' }}
                  value={form.personSelect}
                  onChange={e => {
                    const v = e.target.value;
                    setForm({ ...form, personSelect: v, person: v === '__other__' ? '' : v });
                  }}
                >
                  <option value="">選択してください</option>
                  {persons.map(name => <option key={name} value={name}>{name}</option>)}
                  <option value="__other__">その他（直接入力）</option>
                </select>
                {form.personSelect === '__other__' && (
                  <input
                    type="text"
                    className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700 mt-2"
                    style={{ fontSize: '16px' }}
                    value={form.person}
                    onChange={e => setForm({ ...form, person: e.target.value })}
                    placeholder="担当者名を入力"
                    autoFocus
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                style={{ fontSize: '16px' }}
                value={form.person}
                onChange={e => setForm({ ...form, person: e.target.value })}
                placeholder="例: 山田、業者A（設定で担当者を登録するとプルダウンになります）"
              />
            )}
          </div>

          <div>
            <label className="text-base text-slate-700 mb-1.5 block font-medium">特記事項（任意）</label>
            <textarea
              className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="例: 排水溝を清掃した、ゴミが多かった、次回は〇〇を確認する"
            />
          </div>

          <button
            onClick={save}
            disabled={loading || !form.cleaned_date || !form.person || (persons.length > 0 && !form.personSelect)}
            className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50"
          >
            <Check size={18} /> {editTarget ? '保存する' : '追加する'}
          </button>
        </Modal>
      )}
    </div>
  );
}
