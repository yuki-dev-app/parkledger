'use client';
import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Download, TrendingUp } from 'lucide-react';
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
  const [settings,   setSettings]   = useState<Settings>({ business_name: '', business_address: '', business_phone: '', parking_name: '', parking_address: '', receipt_no_prefix: 'R', cleaning_persons: '' });
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

  useScrollLock(!!reminder);

  const paidCount   = rows.filter(r => r.status === 'paid').length;
  const unpaidCount = rows.length - paidCount;
  const paidTotal   = rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const unpaidTotal = rows.filter(r => r.status !== 'paid').reduce((s, r) => s + r.amount, 0);
  const rate        = rows.length > 0 ? Math.round((paidCount / rows.length) * 100) : 0;

  const filteredRows = (
    filter === 'all'    ? rows :
    filter === 'unpaid' ? rows.filter(r => r.status !== 'paid') :
                          rows.filter(r => r.status === 'paid')
  ).filter(r => !search || r.contractor_name.includes(search) || r.garage_number.includes(search));

  const TABS: { key: FilterType; label: string; count: number }[] = [
    { key: 'unpaid', label: '未入金',   count: unpaidCount },
    { key: 'paid',   label: '入金済み', count: paidCount   },
    { key: 'all',    label: '全て',     count: rows.length  },
  ];

  return (
    <div className="max-w-2xl md:max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-3">
        <h1 className="text-2xl font-bold text-slate-900">入金チェック</h1>
      </div>

      <YearMonthPicker
        year={year}
        month={month}
        onChange={(y, m) => { setYear(y); setMonth(m); }}
      />

      {/* ── サマリーパネル ── */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-3">
          {/* 進捗バー */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp size={15} className="text-slate-500" />
              入金進捗
            </span>
            <span className="text-sm font-bold text-slate-600 tabular-nums">
              {paidCount}<span className="font-normal text-slate-400">/{rows.length}件</span>
              <span className="ml-2 text-emerald-600">{rate}%</span>
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${rate}%` }}
            />
          </div>

          {/* 入金済み・未入金 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-600 mb-1">入金済み</p>
              <p className="text-xl font-black text-emerald-700 tabular-nums leading-none">
                ¥{paidTotal.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-500 mt-1.5">{paidCount}件</p>
            </div>
            <div className={`border rounded-xl p-3 ${unpaidTotal > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`text-xs font-bold mb-1 ${unpaidTotal > 0 ? 'text-red-600' : 'text-slate-400'}`}>未入金</p>
              <p className={`text-xl font-black tabular-nums leading-none ${unpaidTotal > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                ¥{unpaidTotal.toLocaleString()}
              </p>
              <p className={`text-xs mt-1.5 ${unpaidTotal > 0 ? 'text-red-500' : 'text-slate-300'}`}>{unpaidCount}件</p>
            </div>
          </div>

          {/* CSV ダウンロード */}
          <a
            href={`/api/payments/export?year_month=${ym}`}
            className="mt-3 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 hover:bg-slate-100 transition-colors"
          >
            <Download size={16} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700">{year}年{month}月　月次レポートをダウンロード</p>
              <p className="text-xs text-slate-400 mt-0.5">CSV形式 · Excel・会計ソフトで使用可</p>
            </div>
          </a>
        </div>
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

      {/* フィルタータブ */}
      <div className="flex gap-1.5 mb-3 bg-slate-100 rounded-2xl p-1.5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-xl font-medium transition-all ${
              filter === tab.key
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`text-xl font-black tabular-nums leading-none ${
              filter === tab.key
                ? tab.key === 'unpaid' && unpaidCount > 0 ? 'text-red-500'
                : tab.key === 'paid'   ? 'text-emerald-600'
                : 'text-slate-700'
                : ''
            }`}>
              {tab.count}
            </span>
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* カード一覧 */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
