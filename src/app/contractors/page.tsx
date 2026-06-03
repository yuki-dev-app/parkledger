'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Check, Archive, Users, Search } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import { getCached, setCached } from '@/lib/page-cache';
import ContractorCard, { type Contractor } from './_components/ContractorCard';
import { inputCls } from '@/lib/styles';

type Garage = { id: number; number: string; status: string };

const emptyForm = {
  garage_id: '', name: '', phone: '', email: '', address: '',
  vehicle_type: '', vehicle_number: '', vehicle_chassis: '',
  emergency_contact: '', contract_start: '', contract_end: '', notes: '',
};

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [vacantGarages, setVacantGarages] = useState<Garage[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState<{ id: number; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [editTarget, setEditTarget] = useState<Contractor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const cachedC = getCached<Contractor[]>('contractors');
    const cachedG = getCached<Garage[]>('garages');
    if (cachedC && cachedG) {
      setContractors(cachedC);
      setVacantGarages(cachedG.filter(g => g.status === 'vacant'));
      setDataLoading(false);
    } else setDataLoading(true);

    const [cRes, gRes] = await Promise.all([fetch('/api/contractors'), fetch('/api/garages')]);
    const [cJson, gJson] = await Promise.all([cRes.json().catch(() => []), gRes.json().catch(() => [])]);
    const contractors = Array.isArray(cJson) ? cJson : [];
    const garages     = Array.isArray(gJson) ? gJson : [];
    setCached('contractors', contractors);
    setCached('garages', garages);
    setContractors(contractors);
    setVacantGarages(garages.filter((g: Garage) => g.status === 'vacant'));
    setDataLoading(false);
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
    setToast({ message: '解約処理が完了しました', kind: 'success' });
    load();
  };

  const remove = async (id: number) => {
    const res = await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    if (!res.ok) { setToast({ message: '削除に失敗しました', kind: 'error' }); return; }
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  // scrollLock は各 <Modal> コンポーネントが内部で管理するため不要

  const expiringCount = contractors.filter(c => {
    const d = daysUntil(c.contract_end);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  const filtered = contractors.filter(c =>
    !search || c.name.includes(search) || c.garage_number.includes(search) || c.phone?.includes(search)
  );

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">契約者</h1>
          <p className="text-base text-slate-600 mt-0.5">
            {contractors.length} 名
            {expiringCount > 0 && (
              <span className="ml-2 text-amber-600 font-bold">・期限まもなく {expiringCount} 名</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/contractors/archived"
            className="flex items-center gap-1.5 text-slate-600 border border-slate-200 bg-white px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm"
          >
            <Archive size={15} /> 解約履歴
          </Link>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-700 shadow-sm text-base"
          >
            <Plus size={18} /> 追加
          </button>
        </div>
      </div>

      {/* 検索バー */}
      <div className="relative mb-4">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-slate-700 shadow-sm"
          placeholder="名前・区画番号で検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* 削除確認 */}
      {deleteTarget && (
        <ConfirmDialog
          title={`${deleteTarget.name} さんを削除`}
          message="入金履歴も含め完全に削除されます。解約のみなら「解約する」をご使用ください。この操作は元に戻せません。"
          confirmLabel="完全に削除する"
          onConfirm={() => remove(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* 一覧 */}
      <div className="flex flex-col gap-2">
        {dataLoading && <SkeletonList count={3} lines={2} />}

        {!dataLoading && contractors.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={30} className="text-slate-400" />
            </div>
            <p className="font-bold text-slate-700 text-lg mb-2">契約者がいません</p>
            <p className="text-sm text-slate-400 mb-6">「追加」から契約者を登録してください</p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold text-base hover:bg-slate-700"
            >
              <Plus size={18} /> 契約者を追加する
            </button>
          </div>
        )}

        {!dataLoading && search && filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-base">
            「{search}」に一致する方が見つかりません
          </div>
        )}

        {filtered.map(c => (
          <ContractorCard
            key={c.id}
            contractor={c}
            days={daysUntil(c.contract_end)}
            isOpen={expanded === c.id}
            onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
            onEdit={openEdit}
            onArchive={(id, name) => { setShowArchiveModal({ id, name }); setArchiveReason(''); }}
            onDelete={(id, name) => setDeleteTarget({ id, name })}
          />
        ))}
      </div>

      {/* 解約モーダル */}
      {showArchiveModal && (
        <Modal title="解約処理" onClose={() => setShowArchiveModal(null)}>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-base text-amber-800 font-bold">{showArchiveModal.name} さんを解約します</p>
            <p className="text-sm text-amber-700 mt-1">区画が「空き」に戻ります。入金履歴は保持されます。</p>
          </div>
          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">解約理由（任意）</label>
            <input
              className={inputCls}
              value={archiveReason}
              onChange={e => setArchiveReason(e.target.value)}
              placeholder="例: 引越し、車の売却"
            />
          </div>
          <button
            onClick={archive}
            disabled={loading}
            className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-amber-600 disabled:opacity-50"
          >
            <Archive size={18} /> 解約処理を実行する
          </button>
        </Modal>
      )}

      {/* 契約者追加・編集フォーム */}
      {showForm && (
        <Modal
          title={editTarget ? `${editTarget.name} さんを編集` : '新しい契約者を追加'}
          onClose={() => setShowForm(false)}
        >
          {/* 区画選択 */}
          {!editTarget ? (
            <div>
              <label className="text-base font-bold text-slate-700 mb-2 block">区画番号 <span className="text-red-500">*</span></label>
              <select className={inputCls} value={form.garage_id} onChange={e => setForm({ ...form, garage_id: e.target.value })}>
                <option value="">どの区画か選んでください</option>
                {vacantGarages.map(g => <option key={g.id} value={g.id}>{g.number}番区画</option>)}
              </select>
              {vacantGarages.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">空き区画がありません。先に区画を登録してください。</p>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-600 font-medium">
              {editTarget.garage_number}番区画
            </div>
          )}

          {/* 基本情報 */}
          {[
            { label: '氏名', key: 'name', placeholder: '例: 田中 太郎', required: true },
            { label: '電話番号', key: 'phone', placeholder: '例: 090-0000-0000', type: 'tel' },
            { label: '住所', key: 'address', placeholder: '例: 〇〇市〇〇町1-2-3' },
            { label: '緊急連絡先', key: 'emergency_contact', placeholder: 'ご家族など（090-0000-0001）' },
            { label: 'メールアドレス', key: 'email', placeholder: 'example@mail.com', type: 'email' },
          ].map(({ label, key, placeholder, type, required }) => (
            <div key={key}>
              <label className="text-base font-bold text-slate-700 mb-2 block">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                className={inputCls}
                value={form[key as keyof typeof form]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                type={type ?? 'text'}
              />
            </div>
          ))}

          {/* 車両情報 */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-slate-500">お車の情報（車庫証明に使用）</p>
            {[
              { label: '車種・メーカー', key: 'vehicle_type', placeholder: '例: プリウス' },
              { label: '登録番号（ナンバー）', key: 'vehicle_number', placeholder: '例: 品川 300 あ 12-34' },
              { label: '車台番号（車検証に記載）', key: 'vehicle_chassis', placeholder: '例: ZVW30-XXXXXXX' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">{label}</label>
                <input
                  className="border border-slate-300 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white text-base"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          {/* 契約期間 */}
          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">契約開始日 <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.contract_start} onChange={e => setForm({ ...form, contract_start: e.target.value })} type="date" />
          </div>
          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">契約終了日</label>
            <input className={inputCls} value={form.contract_end} onChange={e => setForm({ ...form, contract_end: e.target.value })} type="date" />
            <p className="text-sm text-slate-400 mt-1">※ 終了30日前に画面で警告が表示されます</p>
          </div>
          <div>
            <label className="text-base font-bold text-slate-700 mb-2 block">メモ（任意）</label>
            <textarea className={inputCls} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <button
            onClick={save}
            disabled={loading || !form.name || !form.contract_start || (!editTarget && !form.garage_id)}
            className="w-full bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ minHeight: '56px', fontSize: '16px' }}
          >
            <Check size={20} /> {editTarget ? '保存する' : '追加する'}
          </button>
        </Modal>
      )}
    </div>
  );
}
