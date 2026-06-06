'use client';
import { useState } from 'react';
import { Check, Bell, Undo2, FileText, Printer, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { Row, ReminderInfo } from '../_types';

type Props = {
  row:          Row;
  busy:         boolean;
  reminderInfo: ReminderInfo | undefined;
  onToggle:     (row: Row, next: 'paid' | 'unpaid', paidDate?: string) => void;
  onReminder:   (row: Row) => void;
};

const Spinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// 今日の日付（日本時間）
const todayJST = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

export default function PaymentCard({ row, busy, reminderInfo, onToggle, onReminder }: Props) {
  const paid = row.status === 'paid';
  const [paidDate, setPaidDate] = useState(todayJST);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden flex flex-col ${
      paid ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-900'
    }`}>
      {/* ステータス色帯 */}
      <div className={`h-1.5 ${paid ? 'bg-emerald-400' : 'bg-red-400'}`} />

      {/* メイン情報 */}
      <div className="px-4 pt-3 pb-2 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-md font-black border shrink-0 ${
                paid
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}>
                {row.garage_number}番
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight truncate">
                {row.contractor_name}
              </span>
            </div>
          </div>
          {paid ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0">
              <Check size={12} strokeWidth={3} /> 入金済み
            </span>
          ) : (
            <span className="text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 shrink-0">
              未入金
            </span>
          )}
        </div>

        <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none mb-1">
          ¥{row.amount.toLocaleString()}
        </p>

        {paid && row.paid_date && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            {row.paid_date} 入金確認
          </p>
        )}
        {!paid && reminderInfo && (
          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1">
            <Bell size={11} />
            最終連絡: {reminderInfo.reminded_at}（{reminderInfo.count}回目）
          </p>
        )}
      </div>

      {/* アクション */}
      <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
        {!paid ? (
          <>
            {/* 入金日選択 */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2">
              <CalendarDays size={15} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <label className="text-sm text-slate-500 dark:text-slate-400 shrink-0">入金日</label>
              <input
                type="date"
                value={paidDate}
                max={todayJST()}
                onChange={e => setPaidDate(e.target.value)}
                className="flex-1 bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none min-w-0"
                style={{ fontSize: '15px' }}
              />
            </div>

            <button
              type="button"
              onClick={() => onToggle(row, 'paid', paidDate)}
              disabled={busy || !paidDate}
              className="w-full bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ minHeight: '52px' }}
            >
              {busy ? <Spinner /> : <Check size={20} strokeWidth={3} />}
              入金済みにする
            </button>
            <button
              type="button"
              onClick={() => onReminder(row)}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Bell size={14} /> 連絡する・督促文を送る
            </button>
          </>
        ) : (
          <>
            {row.payment_id && (
              <Link
                href={`/print/receipt/${row.payment_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 bg-slate-800 dark:bg-slate-700 text-white py-3 px-4 rounded-xl font-bold text-sm hover:bg-slate-700 dark:hover:bg-slate-600"
              >
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Printer size={16} />
                </div>
                <div className="text-left">
                  <p className="font-bold leading-tight">領収書を発行・印刷</p>
                  <p className="text-xs text-white/60 mt-0.5">印鑑を押してお渡しください</p>
                </div>
              </Link>
            )}
            <Link
              href={`/print/parking/${row.contractor_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2.5 px-3.5 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <FileText size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">車庫証明書</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">陸運局・警察署への申請用</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => onToggle(row, 'unpaid')}
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 py-2 rounded-xl text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <Undo2 size={13} /> 未入金に戻す
            </button>
          </>
        )}
      </div>
    </div>
  );
}
