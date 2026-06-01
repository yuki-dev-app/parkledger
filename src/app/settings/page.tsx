'use client';
import { useEffect, useState, useCallback } from 'react';
import { Check, Settings as SettingsIcon, Plus, X, Users } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';

type Settings = {
  business_name: string;
  business_address: string;
  business_phone: string;
  parking_name: string;
  parking_address: string;
  receipt_no_prefix: string;
  cleaning_persons: string;
};

const FIELDS: { key: keyof Settings; label: string; placeholder: string; hint?: string }[] = [
  { key: 'business_name', label: '事業者名（氏名・屋号）', placeholder: '例: 山田 太郎', hint: '領収書・車庫証明の発行者名として印刷されます' },
  { key: 'business_address', label: '事業者の住所', placeholder: '例: 〇〇県〇〇市〇〇町1-2-3' },
  { key: 'business_phone', label: '事業者の電話番号', placeholder: '例: 090-0000-0000', hint: '督促文・領収書に表示されます' },
  { key: 'parking_name', label: '駐車場の名称', placeholder: '例: 〇〇パーキング', hint: '領収書の但し書きに使用されます' },
  { key: 'parking_address', label: '駐車場の所在地', placeholder: '例: 〇〇県〇〇市〇〇町4-5', hint: '車庫証明の「保管場所の位置」に印刷されます' },
  { key: 'receipt_no_prefix', label: '領収書番号のプレフィックス', placeholder: 'R（例: R0001）', hint: '領収書番号の先頭に付く文字です' },
];

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({
    business_name: '', business_address: '', business_phone: '',
    parking_name: '', parking_address: '', receipt_no_prefix: 'R',
    cleaning_persons: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [newPerson, setNewPerson] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/settings');
    setForm(await res.json());
  }, []);

  const persons = form.cleaning_persons
    ? form.cleaning_persons.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const addPerson = async () => {
    const name = newPerson.trim();
    if (!name || persons.includes(name)) return;
    const updated = [...persons, name].join(',');
    setForm(f => ({ ...f, cleaning_persons: updated }));
    setNewPerson('');
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleaning_persons: updated }),
    });
    setToast({ message: `${name} を追加しました`, kind: 'success' });
  };

  const removePerson = async (name: string) => {
    const updated = persons.filter(p => p !== name).join(',');
    setForm(f => ({ ...f, cleaning_persons: updated }));
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleaning_persons: updated }),
    });
    setToast({ message: `${name} を削除しました`, kind: 'success' });
  };

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setLoading(true);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setToast({ message: res.ok ? '保存しました' : '保存に失敗しました', kind: res.ok ? 'success' : 'error' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex items-center gap-3 mb-5">
        <div className="bg-slate-800 text-white rounded-xl w-11 h-11 flex items-center justify-center">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">事業者設定</h2>
          <p className="text-sm text-slate-500">領収書・車庫証明・督促文に使用する情報です</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-5">
        {FIELDS.map(({ key, label, placeholder, hint }) => (
          <div key={key}>
            <label className="text-base font-medium text-slate-700 mb-1.5 block">{label}</label>
            <input
              className="border border-slate-300 rounded-xl px-4 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
              value={(form as Record<string, string>)[key] ?? ''}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
            />
            {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
          </div>
        ))}

        <button
          onClick={save}
          disabled={loading}
          className="bg-slate-800 text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50 transition-colors"
        >
          <Check size={18} /> {loading ? '保存中...' : '保存する'}
        </button>
      </div>

      {/* 清掃担当者リスト */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-slate-600" />
          <h3 className="text-base font-bold text-slate-900">清掃担当者リスト</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">清掃記録で担当者をプルダウン選択できるようになります</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {persons.length === 0 && (
            <p className="text-sm text-slate-400">担当者が登録されていません</p>
          )}
          {persons.map(name => (
            <span key={name} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium">
              {name}
              <button onClick={() => removePerson(name)} className="text-slate-400 hover:text-red-500">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="border border-slate-300 rounded-xl px-3 py-2.5 flex-1 text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
            style={{ fontSize: '16px' }}
            value={newPerson}
            onChange={e => setNewPerson(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addPerson(); }}
            placeholder="例: 田中、業者A"
          />
          <button
            onClick={addPerson}
            disabled={!newPerson.trim()}
            className="flex items-center gap-1 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-slate-700 disabled:opacity-40"
          >
            <Plus size={16} /> 追加
          </button>
        </div>
      </div>

      {/* 不足項目の説明 */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-amber-800 mb-2">📋 車庫証明について（補足）</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside leading-relaxed">
          <li>型式・原動機型式が必要な場合は、印刷後に手書きで追記してください</li>
          <li>自動車の大きさ（長さ・幅・高さ）は車検証でご確認ください</li>
          <li>各都道府県警察の公式様式と合わせてご利用ください</li>
          <li>発行者の実印（認印でも可）を押してから提出してください</li>
        </ul>
      </div>
    </div>
  );
}
