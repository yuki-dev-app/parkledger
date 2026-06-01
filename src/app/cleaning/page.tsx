'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, Sparkles } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';

type CleaningLog = {
  id: number;
  cleaned_date: string;
  person: string;
  notes: string;
  created_at: string;
};

const emptyForm = { cleaned_date: '', person: '', notes: '', personSelect: '' };

// 今日の日付を YYYY-MM-DD 形式で返す
function today() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}

export default function CleaningPage() {
  const [logs, setLogs] = useState<CleaningLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CleaningLog | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [persons, setPersons] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [cRes, sRes] = await Promise.all([fetch('/api/cleaning'), fetch('/api/settings')]);
    setLogs(await cRes.json());
    const settings = await sRes.json();
    const list = settings.cleaning_persons
      ? settings.cleaning_persons.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    setPersons(list);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ ...emptyForm, cleaned_date: today() });
    setEditTarget(null);
    setShowForm(true);
  };

  const openEdit = (log: CleaningLog) => {
    const isInList = persons.includes(log.person);
    setForm({
      cleaned_date: log.cleaned_date,
      person: isInList ? log.person : log.person,
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

  const remove = async (id: number, date: string) => {
    if (!confirm(`${formatDate(date)}の記録を削除しますか？`)) return;
    await fetch(`/api/cleaning/${id}`, { method: 'DELETE' });
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">清掃記録</h1>
          <p className="text-xs text-slate-400 mt-0.5">全 {logs.length} 件</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-slate-800 text-white px-3.5 py-2 rounded-xl font-medium hover:bg-slate-700 shadow-sm text-sm"
        >
          <Plus size={15} /> 記録を追加
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-sm">{formatDate(log.cleaned_date)}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{log.person}</span>
                </div>
                {log.notes && (
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 bg-slate-50 rounded-lg px-2.5 py-1.5">{log.notes}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5">登録: {log.created_at.slice(0, 10)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(log)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  <Pencil size={12} /> 編集
                </button>
                <button
                  onClick={() => remove(log.id, log.cleaned_date)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={12} /> 削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 入力フォーム（モーダル） */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:mx-4 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">
                {editTarget ? '清掃記録を編集' : '清掃記録を追加'}
              </h3>
              <button onClick={() => setShowForm(false)} className="flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100" style={{ minWidth:'44px', minHeight:'44px' }}><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">
                  清掃した日 *
                </label>
                <input
                  type="date"
                  className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={form.cleaned_date}
                  onChange={e => setForm({ ...form, cleaned_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">
                  担当者 *
                </label>
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
                      {persons.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
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
                <label className="text-base text-slate-700 mb-1.5 block font-medium">
                  特記事項（任意）
                </label>
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
                className="bg-slate-800 text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50"
              >
                <Check size={18} /> {editTarget ? '保存する' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
