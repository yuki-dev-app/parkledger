'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, Phone, MapPin, Car, AlertTriangle, FileText, Archive } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/Toast';

type Contractor = {
  id: number;
  garage_id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  vehicle_type: string;
  vehicle_number: string;
  vehicle_chassis: string;
  emergency_contact: string;
  contract_start: string;
  contract_end: string;
  notes: string;
  garage_number: string;
  monthly_fee: number;
};

type Garage = { id: number; number: string; status: string };

const emptyForm = {
  garage_id: '', name: '', phone: '', email: '', address: '',
  vehicle_type: '', vehicle_number: '', vehicle_chassis: '',
  emergency_contact: '', contract_start: '', contract_end: '', notes: '',
};

const FIELDS: { label: string; key: keyof typeof emptyForm; placeholder: string; type?: string }[] = [
  { label: '氏名 *', key: 'name', placeholder: '田中 太郎' },
  { label: '住所', key: 'address', placeholder: '〇〇市〇〇町1-2-3' },
  { label: '電話番号', key: 'phone', placeholder: '090-0000-0000', type: 'tel' },
  { label: '緊急連絡先', key: 'emergency_contact', placeholder: 'ご家族など（090-0000-0001）' },
  { label: 'メールアドレス', key: 'email', placeholder: 'example@mail.com', type: 'email' },
  { label: '車種・メーカー', key: 'vehicle_type', placeholder: '例: プリウス' },
  { label: '登録番号（ナンバー）', key: 'vehicle_number', placeholder: '例: 品川 300 あ 12-34' },
  { label: '車台番号（車検証に記載）', key: 'vehicle_chassis', placeholder: '例: ZVW30-XXXXXXX' },
];

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [vacantGarages, setVacantGarages] = useState<Garage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState<{ id: number; name: string } | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [editTarget, setEditTarget] = useState<Contractor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);

  const load = useCallback(async () => {
    const [cRes, gRes] = await Promise.all([fetch('/api/contractors'), fetch('/api/garages')]);
    setContractors(await cRes.json());
    const gs = await gRes.json();
    setVacantGarages(gs.filter((g: Garage) => g.status === 'vacant'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyForm); setEditTarget(null); setShowForm(true); };
  const openEdit = (c: Contractor) => {
    setForm({
      garage_id: String(c.garage_id), name: c.name, phone: c.phone, email: c.email,
      address: c.address ?? '', vehicle_type: c.vehicle_type ?? '',
      vehicle_number: c.vehicle_number ?? '', vehicle_chassis: c.vehicle_chassis ?? '',
      emergency_contact: c.emergency_contact ?? '',
      contract_start: c.contract_start, contract_end: c.contract_end, notes: c.notes,
    });
    setEditTarget(c);
    setShowForm(true);
  };

  const save = async () => {
    setLoading(true);
    const body = { ...form, garage_id: Number(form.garage_id) };
    const res = editTarget
      ? await fetch(`/api/contractors/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/contractors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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

  const archive = async () => {
    if (!showArchiveModal) return;
    setLoading(true);
    const res = await fetch(`/api/contractors/${showArchiveModal.id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: archiveReason }),
    });
    setLoading(false);
    setShowArchiveModal(null);
    setArchiveReason('');
    if (!res.ok) { setToast({ message: '解約処理に失敗しました', kind: 'error' }); return; }
    setToast({ message: '解約処理が完了しました。履歴に保存されました。', kind: 'success' });
    load();
  };

  const remove = async (id: number, name: string) => {
    if (!confirm(`${name} さんのデータを完全に削除しますか？\n解約履歴も消えます。解約のみなら「解約」ボタンをご使用ください。`)) return;
    const res = await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
    if (!res.ok) { setToast({ message: '削除に失敗しました', kind: 'error' }); return; }
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  const expiringCount = contractors.filter(c => {
    const d = daysUntil(c.contract_end);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">契約者管理</h2>
          <p className="text-base text-slate-500">
            {contractors.length} 名
            {expiringCount > 0 && <span className="ml-2 text-amber-600 font-medium">・更新期限 {expiringCount} 名</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/contractors/archived"
            className="flex items-center gap-1.5 text-slate-600 border border-slate-300 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 active:bg-slate-100">
            <Archive size={16} /> 解約履歴
          </Link>
          <button onClick={openNew}
            className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-slate-700 active:bg-slate-900 shadow-sm">
            <Plus size={18} /> 追加
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {contractors.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-slate-400 text-base">契約者がいません</p>
          </div>
        )}
        {contractors.map(c => {
          const days = daysUntil(c.contract_end);
          const expiringSoon = days !== null && days >= 0 && days <= 30;
          const expired = days !== null && days < 0;

          return (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${expiringSoon ? 'border-l-4 border-l-amber-400 border-r-slate-200 border-t-slate-200 border-b-slate-200' : expired ? 'border-l-4 border-l-red-400 border-r-slate-200 border-t-slate-200 border-b-slate-200' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold shrink-0">#{c.garage_number}</span>
                    <span className="font-bold text-slate-900 text-lg">{c.name}</span>
                    {expiringSoon && (
                      <span className="flex items-center gap-0.5 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        <AlertTriangle size={11} /> あと{days}日
                      </span>
                    )}
                    {expired && (
                      <span className="flex items-center gap-0.5 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        <AlertTriangle size={11} /> 期限切れ
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-slate-500 space-y-0.5">
                    <p>¥{c.monthly_fee?.toLocaleString()}/月　　契約: {c.contract_start} 〜 {c.contract_end || '未定'}</p>
                    {(c.vehicle_type || c.vehicle_number) && (
                      <p className="flex items-center gap-1"><Car size={13} className="text-slate-400 shrink-0" />{c.vehicle_type}{c.vehicle_number ? `　${c.vehicle_number}` : ''}</p>
                    )}
                    {c.address && (
                      <p className="flex items-center gap-1"><MapPin size={13} className="text-slate-400 shrink-0" />{c.address}</p>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-blue-700 font-medium text-base">
                        <Phone size={14} />{c.phone}
                      </a>
                    )}
                    {c.emergency_contact && <p className="text-xs text-slate-400">緊急: {c.emergency_contact}</p>}
                    {c.notes && <p className="text-xs text-slate-400">{c.notes}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-1 ml-3 shrink-0">
                  <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100">
                    <Pencil size={14} /> 編集
                  </button>
                  <button onClick={() => { setShowArchiveModal({ id: c.id, name: c.name }); setArchiveReason(''); }}
                    className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 px-2 py-1.5 rounded-lg hover:bg-amber-50">
                    <Archive size={14} /> 解約
                  </button>
                  <button onClick={() => remove(c.id, c.name)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={14} /> 削除
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <Link href={`/print/parking/${c.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-slate-700 active:bg-slate-900">
                  <FileText size={15} /> 車庫証明（保管場所使用承諾証明書）
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ 解約モーダル ══ */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">解約処理</h3>
              <button onClick={() => setShowArchiveModal(null)} className="p-2 text-slate-400 hover:text-slate-700"><X size={22} /></button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-amber-800 font-medium">{showArchiveModal.name} さんを解約します</p>
              <p className="text-xs text-amber-700 mt-0.5">区画が「空き」になります。入金履歴は保持されます。</p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">解約理由（任意）</label>
                <input className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={archiveReason} onChange={e => setArchiveReason(e.target.value)}
                  placeholder="例: 引越し、車の売却、転居" />
              </div>
              <button onClick={archive} disabled={loading}
                className="bg-amber-600 text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-amber-700 disabled:opacity-50">
                <Archive size={18} /> 解約処理を実行する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ 契約者フォームモーダル ══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">{editTarget ? '契約者を編集' : '契約者を追加'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-700"><X size={22} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {!editTarget ? (
                <div>
                  <label className="text-base text-slate-700 mb-1.5 block font-medium">区画 *</label>
                  <select className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                    value={form.garage_id} onChange={e => setForm({ ...form, garage_id: e.target.value })}>
                    <option value="">選択してください</option>
                    {vacantGarages.map(g => <option key={g.id} value={g.id}>#{g.number}</option>)}
                  </select>
                  {vacantGarages.length === 0 && <p className="text-xs text-amber-600 mt-1">空き区画がありません</p>}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-base text-slate-600">
                  区画: #{editTarget.garage_number}
                </div>
              )}

              {FIELDS.map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-base text-slate-700 mb-1.5 block font-medium">{label}</label>
                  <input
                    className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    type={type ?? 'text'}
                  />
                  {key === 'vehicle_chassis' && (
                    <p className="text-xs text-slate-400 mt-0.5">※車庫証明に必要です。車検証右上に記載されています。</p>
                  )}
                </div>
              ))}

              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">契約開始日 *</label>
                <input className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={form.contract_start} onChange={e => setForm({ ...form, contract_start: e.target.value })} type="date" />
              </div>
              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">契約終了日</label>
                <input className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={form.contract_end} onChange={e => setForm({ ...form, contract_end: e.target.value })} type="date" />
                <p className="text-xs text-slate-400 mt-0.5">※ 30日前に警告が表示されます</p>
              </div>
              <div>
                <label className="text-base text-slate-700 mb-1.5 block font-medium">備考</label>
                <textarea className="border border-slate-300 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>

              <button onClick={save} disabled={loading || !form.name || !form.contract_start || (!editTarget && !form.garage_id)}
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
