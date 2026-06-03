'use client';
import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Download } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/Toast';
import { useScrollLock } from '@/lib/use-scroll-lock';
import { getCached, setCached, invalidateCache } from '@/lib/page-cache';
import type { Settings } from '@/lib/settings';
import YearMonthPicker from './_components/YearMonthPicker';
import ReminderModal   from './_components/ReminderModal';
import PaymentCard     from './_components/PaymentCard';

import type { Row, ReminderInfo } from './_types';

type FilterType = 'unpaid' | 'paid' | 'all';

export default function PaymentsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows,       setRows]       = useState<Row[]>([]);
  const [search,     setSearch]     = useState('');
  const [busyIds,    setBusyIds]    = useState<Set<number>>(new Set());
  const [toast,      setToast]      = useState<ToastType | null>(null);
  const [filter,     setFilter]     = useState<FilterType>('unpaid');
  const [reminder,   setReminder]   = useState<Row | null>(null);
  // Settings の初期値はlib/settings.tsのデフォルト値に合わせる
  const [settings,   setSettings]   = useState<Settings>({ business_name: '', business_address: '', business_phone: '', parking_name: '', parking_address: '', receipt_no_prefix: 'R', cleaning_persons: '' });
  // showPicker は YearMonthPicker コンポーネント内部で管理
  const [reminders,   setReminders]   = useState<Map<number, ReminderInfo>>(new Map());

  const ym = `${year}-${String(month).padStart(2, '0')}`;

  const load = useCallback(async () => {
    const cachedRows = getCached<Row[]>(`payments:${ym}`);
    if (cachedRows) setRows(cachedRows);

    const [pRes, sRes, rRes] = await Promise.all([
      fetch(`/api/payments?year_month=${ym}`),
      fetch('/api/settings'),
      fetch(`/api/payments/remind?year_month=${ym}`),
    ]);
    const [pJson, sJson, rJson] = await Promise.all([
      pRes.json().catch(() => []),
      sRes.json().catch(() => ({})),
      rRes.json().catch(() => []),
    ]);
    const rows = Array.isArray(pJson) ? pJson as Row[] : [];
    setCached(`payments:${ym}`, rows);
    setRows(rows);
    if (sJson.parking_name !== undefined) setSettings(sJson);
    if (Array.isArray(rJson)) {
      setReminders(new Map(rJson.map((r: ReminderInfo) => [r.contractor_id, r])));
    }
  }, [ym]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (row: Row, next: 'paid' | 'unpaid') => {
    setBusyIds(prev => new Set(prev).add(row.contractor_id));
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractor_id: row.contractor_id, year_month: ym, status: next }),
    });
    setBusyIds(prev => { const s = new Set(prev); s.delete(row.contractor_id); return s; });
    if (!res.ok) { setToast({ message: '更新に失敗しました', kind: 'error' }); return; }
    invalidateCache(`payments:${ym}`);
    setToast({
      message: next === 'paid' ? `${row.contractor_name} さんの入金を確認しました` : '未入金に戻しました',
      kind: 'success',
    });
    load();
  };

  const openReminder = (row: Row) => setReminder(row);

  const recordReminder = async (row: Row, method: 'phone' | 'email' | 'other') => {
    const res = await fetch('/api/payments/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractor_id: row.contractor_id, year_month: ym, method }),
    });
    if (res.ok) {
      const { reminded_at } = await res.json();
      setReminders(prev => {
        const next = new Map(prev);
        const existing = next.get(row.contractor_id);
        next.set(row.contractor_id, {
          contractor_id: row.contractor_id,
          reminded_at,
          count: (existing?.count ?? 0) + 1,
        });
        return next;
      });
    }
  };

  // 督促モーダル表示中のスクロールロック（ReminderModal 内部でも useScrollLock を呼ぶが念のため）
  useScrollLock(!!reminder);

  const paidCount   = rows.filter(r => r.status === 'paid').length;
  const unpaidCount = rows.length - paidCount;

  const filteredRows = (
    filter === 'all'    ? rows :
    filter === 'unpaid' ? rows.filter(r => r.status !== 'paid') :
                          rows.filter(r => r.status === 'paid')
  ).filter(r => !search || r.contractor_name.includes(search) || r.garage_number.includes(search));

  const TABS: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: 'unpaid', label: '未入金', count: unpaidCount, color: unpaidCount > 0 ? 'text-red-600' : 'text-slate-500' },
    { key: 'paid',   label: '入金済み', count: paidCount,   color: 'text-emerald-600' },
    { key: 'all',    label: '全て見る', count: rows.length,  color: 'text-slate-600' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ページヘッダー */}
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-slate-900">入金チェック</h1>
      </div>

      {/* 月ナビ（YearMonthPickerが月送り矢印・ピッカーを内包） */}
      <YearMonthPicker
        year={year}
        month={month}
        onChange={(y, m) => { setYear(y); setMonth(m); }}
      />

      {/* ── 月次レポート（CSV）── 実務用に目立たせる */}
      {rows.length > 0 && (
        <a
          href={`/api/payments/export?year_month=${ym}`}
          className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 mb-3 hover:border-slate-400 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <Download size={20} className="text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-base">{year}年{month}月　月次レポート</p>
            <p className="text-sm text-slate-500 mt-0.5">CSV形式 · Excelで開けます · 経理・確定申告に利用可</p>
          </div>
        </a>
      )}

      {/* 検索 */}
      {rows.length > 0 && (
        <div className="relative mb-3">
          <input
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-slate-700 shadow-sm"
            placeholder="名前・区画番号で検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
      )}

      {/* ── フィルタータブ ── */}
      <div className="flex gap-1.5 mb-3 bg-slate-100 rounded-2xl p-1.5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 flex flex-col items-center py-2 rounded-xl font-medium transition-all ${
              filter === tab.key
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`text-lg font-black tabular-nums leading-none ${filter === tab.key ? tab.color : ''}`}>
              {tab.count}
            </span>
            <span className="text-sm mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── カード一覧 ── */}
      <div className="flex flex-col gap-3">
        {rows.length === 0 && (
          <div className="text-center py-14 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard size={26} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium text-base mb-1">この月の対象者がいません</p>
            <Link href="/contractors" className="text-sm text-blue-600 font-medium underline">契約者を登録する</Link>
          </div>
        )}

        {filteredRows.length === 0 && rows.length > 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            {filter === 'unpaid' ? '未入金の方はいません ✓' : '入金済みの方はいません'}
          </div>
        )}

        {filteredRows.map(row => (
          <PaymentCard
            key={row.contractor_id}
            row={row}
            busy={busyIds.has(row.contractor_id)}
            reminderInfo={reminders.get(row.contractor_id)}
            onToggle={toggle}
            onReminder={openReminder}
          />
        ))}
      </div>

      {/* 督促モーダル（ReminderModalコンポーネントに分離） */}
      {reminder && (
        <ReminderModal
          reminder={reminder}
          year={year}
          month={month}
          settings={settings}
          onClose={() => setReminder(null)}
          onRecord={recordReminder}
        />
      )}
    </div>
  );
}
