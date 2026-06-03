'use client';
import { Pencil, Trash2, Phone, Car, AlertTriangle, FileText, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/format-date';

export type Contractor = {
  id:               number;
  garage_id:        number;
  name:             string;
  phone:            string;
  email:            string;
  address:          string;
  vehicle_type:     string;
  vehicle_number:   string;
  vehicle_chassis:  string;
  emergency_contact: string;
  contract_start:   string;
  contract_end:     string;
  notes:            string;
  garage_number:    string;
  monthly_fee:      number;
};

type Props = {
  contractor:  Contractor;
  days:        number | null; // contract_end までの残り日数
  isOpen:      boolean;
  onToggle:    () => void;
  onEdit:      (c: Contractor) => void;
  onArchive:   (id: number, name: string) => void;
  onDelete:    (id: number, name: string) => void;
};

/** 契約者一覧の展開カード */
export default function ContractorCard({ contractor: c, days, isOpen, onToggle, onEdit, onArchive, onDelete }: Props) {
  const expiringSoon = days !== null && days >= 0 && days <= 30;
  const expired      = days !== null && days < 0;

  return (
    <div
      className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
        expiringSoon ? 'border-amber-300' : expired ? 'border-red-300' : 'border-slate-200'
      }`}
    >
      {/* ── 一覧行：タップで展開 ── */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-4 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-sm border border-slate-200 shrink-0">
            {c.garage_number}番
          </span>
          <span className="font-bold text-slate-900 text-lg truncate">{c.name} さん</span>
          {expiringSoon && (
            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-bold shrink-0">
              <AlertTriangle size={11} /> あと{days}日
            </span>
          )}
          {expired && (
            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 border border-red-300 px-2 py-0.5 rounded-full font-bold shrink-0">
              <AlertTriangle size={11} /> 期限切れ
            </span>
          )}
        </div>
        <span className="text-slate-400 shrink-0 ml-2">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {/* ── 詳細（展開時のみ表示） ── */}
      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="px-4 py-4 space-y-3">

            {/* 月額・契約期間 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-slate-600 font-medium mb-0.5">月額</p>
                <p className="text-base font-bold text-slate-800">¥{c.monthly_fee?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium mb-0.5">契約期間</p>
                <p className={`text-base font-medium ${expiringSoon || expired ? 'text-amber-700' : 'text-slate-700'}`}>
                  {formatDate(c.contract_start)}<br />〜 {formatDate(c.contract_end)}
                </p>
              </div>
            </div>

            {/* 車両 */}
            {(c.vehicle_type || c.vehicle_number) && (
              <div>
                <p className="text-sm text-slate-600 font-medium mb-0.5">お車</p>
                <p className="text-sm text-slate-700 flex items-center gap-1.5">
                  <Car size={14} className="text-slate-400 shrink-0" />
                  {[c.vehicle_type, c.vehicle_number].filter(Boolean).join('　')}
                </p>
              </div>
            )}

            {/* 住所 */}
            {c.address && (
              <div>
                <p className="text-sm text-slate-600 font-medium mb-0.5">住所</p>
                <p className="text-base text-slate-700">{c.address}</p>
              </div>
            )}

            {/* メモ */}
            {c.notes && (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2">{c.notes}</p>
            )}

            {/* 電話ボタン */}
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 active:bg-blue-800"
              >
                <Phone size={18} /> {c.phone} に電話する
              </a>
            )}
          </div>

          {/* アクションバー */}
          <div className="flex divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/70">
            <button
              type="button"
              onClick={() => onEdit(c)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-slate-700 font-medium text-sm hover:bg-slate-100"
            >
              <Pencil size={15} /> 編集する
            </button>
            <Link
              href={`/print/parking/${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-slate-600 font-medium text-sm hover:bg-slate-100"
            >
              <FileText size={15} /> 車庫証明
            </Link>
            <button
              type="button"
              onClick={() => onArchive(c.id, c.name)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-amber-600 font-medium text-sm hover:bg-amber-50"
            >
              <Archive size={15} /> 解約する
            </button>
          </div>

          {/* 完全削除（誤タップ防止のため目立たないデザイン） */}
          <div className="border-t border-slate-100 px-4 py-2 flex justify-end">
            <button
              type="button"
              onClick={() => onDelete(c.id, c.name)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={13} /> 完全に削除（全履歴消去）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
