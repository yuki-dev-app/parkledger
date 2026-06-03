'use client';
import { Check, Bell, Undo2, FileText, Printer } from 'lucide-react';
import Link from 'next/link';

import type { Row, ReminderInfo } from '../_types';

type Props = {
  row:          Row;
  busy:         boolean;
  reminderInfo: ReminderInfo | undefined;
  onToggle:     (row: Row, next: 'paid' | 'unpaid') => void;
  onReminder:   (row: Row) => void;
};

const Spinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/** 入金チェック画面の1行カード */
export default function PaymentCard({ row, busy, reminderInfo, onToggle, onReminder }: Props) {
  const paid = row.status === 'paid';

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${paid ? 'border-emerald-300' : 'border-slate-200'}`}>
      {/* 名前・金額 */}
      <div className={`px-4 pt-3.5 pb-3 ${paid ? 'bg-emerald-50/50' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold border border-slate-200">
                {row.garage_number}番
              </span>
              <span className="font-bold text-slate-900 text-xl">{row.contractor_name} さん</span>
            </div>
            <p className="text-base text-slate-600 mt-1 font-medium">
              ¥{row.amount.toLocaleString()}
              {paid && row.paid_date && (
                <span className="text-sm text-emerald-600 ml-2 font-normal">{row.paid_date} 入金</span>
              )}
            </p>
            {/* 督促履歴 */}
            {!paid && reminderInfo && (
              <p className="text-sm text-amber-700 mt-1 flex items-center gap-1">
                <Bell size={13} />
                最終連絡: {reminderInfo.reminded_at}（{reminderInfo.count}回）
              </p>
            )}
          </div>
          {paid && (
            <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
              <Check size={15} strokeWidth={3} /> 済み
            </span>
          )}
        </div>
      </div>

      {/* アクション */}
      <div className="px-3 pb-3">
        {!paid ? (
          <div className="flex flex-col gap-2">
            {/* 入金済みにする */}
            <button
              type="button"
              onClick={() => onToggle(row, 'paid')}
              disabled={busy}
              className="w-full bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ minHeight: '54px' }}
            >
              {busy ? <Spinner /> : <Check size={20} strokeWidth={3} />}
              入金済みにする
            </button>
            {/* 督促 */}
            <button
              type="button"
              onClick={() => onReminder(row)}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              <Bell size={15} /> 連絡する・督促文を送る
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 領収書 */}
            {row.payment_id && (
              <Link
                href={`/print/receipt/${row.payment_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 bg-slate-800 text-white py-3.5 px-4 rounded-xl font-bold text-base hover:bg-slate-700 active:bg-slate-900"
              >
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Printer size={18} />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold leading-tight">領収書を発行・印刷</p>
                  <p className="text-xs text-white/70 mt-0.5">印鑑を押してお渡しください</p>
                </div>
              </Link>
            )}
            {/* 車庫証明 */}
            <Link
              href={`/print/parking/${row.contractor_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl font-medium text-sm hover:bg-slate-50"
            >
              <FileText size={16} className="text-slate-500 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">車庫証明（保管場所使用承諾証明書）</p>
                <p className="text-xs text-slate-400 mt-0.5">陸運局・警察署への申請に使用</p>
              </div>
            </Link>
            {/* 取消 */}
            <button
              type="button"
              onClick={() => onToggle(row, 'unpaid')}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-500 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <Undo2 size={14} /> 未入金に戻す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
