'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Check, ChevronLeft, ChevronRight, Download, FileText,
  Undo2, Bell, Copy, X, Phone, Mail, CreditCard, Printer,
} from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/Toast';
import { useScrollLock } from '@/lib/use-scroll-lock';
import { getCached, setCached, invalidateCache } from '@/lib/page-cache';

type Row = {
  contractor_id: number;
  contractor_name: string;
  garage_number: string;
  amount: number;
  payment_id: number | null;
  status: 'paid' | 'unpaid' | 'late';
  paid_date: string;
  phone: string;
  email: string;
};

type Settings = {
  business_name: string;
  business_phone: string;
  parking_name: string;
};

type FilterType = 'unpaid' | 'paid' | 'all';

export default function PaymentsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [filter, setFilter] = useState<FilterType>('unpaid');
  const [reminder, setReminder] = useState<Row | null>(null);
  const [settings, setSettings] = useState<Settings>({ business_name: '', business_phone: '', parking_name: '' });
  const [copied, setCopied] = useState(false);

  const ym = `${year}-${String(month).padStart(2, '0')}`;

  const load = useCallback(async () => {
    const cachedRows = getCached<Row[]>(`payments:${ym}`);
    if (cachedRows) setRows(cachedRows);

    const [pRes, sRes] = await Promise.all([
      fetch(`/api/payments?year_month=${ym}`),
      fetch('/api/settings'),
    ]);
    const [pJson, sJson] = await Promise.all([pRes.json().catch(() => []), sRes.json().catch(() => ({}))]);
    const rows = Array.isArray(pJson) ? pJson as Row[] : [];
    setCached(`payments:${ym}`, rows);
    setRows(rows);
    if (sJson.parking_name !== undefined) setSettings(sJson);
  }, [ym]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  };

  const toggle = async (row: Row, next: 'paid' | 'unpaid') => {
    setBusyId(row.contractor_id);
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractor_id: row.contractor_id, year_month: ym, status: next }),
    });
    setBusyId(null);
    if (!res.ok) { setToast({ message: '更新に失敗しました', kind: 'error' }); return; }
    invalidateCache(`payments:${ym}`);
    setToast({
      message: next === 'paid' ? `${row.contractor_name} さんの入金を確認しました` : '未入金に戻しました',
      kind: 'success',
    });
    load();
  };

  const openReminder = (row: Row) => { setReminder(row); setCopied(false); };

  const reminderText = reminder ? `${reminder.contractor_name} 様

平素よりお世話になっております。
${settings.parking_name || '駐車場'}の管理者${settings.business_name ? '、' + settings.business_name : ''}です。

${year}年${month}月分の駐車場使用料（¥${reminder.amount.toLocaleString()}）の
ご入金がまだ確認できておりません。

お忙しいところ大変恐れ入りますが、
ご確認のうえ、お振込みをお願いいたします。${settings.business_phone ? `

ご不明な点は下記までご連絡ください。
TEL: ${settings.business_phone}` : ''}` : '';

  const copyText = async () => {
    await navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 督促モーダル表示中は背景スクロールを止める（iOS Safari 対応）
  useScrollLock(!!reminder);

  const paidCount   = rows.filter(r => r.status === 'paid').length;
  const unpaidCount = rows.length - paidCount;

  const displayRows =
    filter === 'all'    ? rows :
    filter === 'unpaid' ? rows.filter(r => r.status !== 'paid') :
                          rows.filter(r => r.status === 'paid');

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

      {/* 月ナビ */}
      <div className="flex items-center justify-between mb-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-2 py-1.5">
        <button onClick={prevMonth} aria-label="前の月"
          className="flex items-center justify-center w-12 h-12 text-slate-600 hover:bg-slate-100 rounded-xl active:bg-slate-200">
          <ChevronLeft size={26} />
        </button>
        <span className="font-bold text-slate-900 text-xl">{year}年 {month}月</span>
        <button onClick={nextMonth} aria-label="次の月"
          className="flex items-center justify-center w-12 h-12 text-slate-600 hover:bg-slate-100 rounded-xl active:bg-slate-200">
          <ChevronRight size={26} />
        </button>
      </div>

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
            <p className="text-xs text-slate-500 mt-0.5">CSV形式 · Excelで開けます · 経理・確定申告に利用可</p>
          </div>
        </a>
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
            <span className="text-xs mt-0.5">{tab.label}</span>
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

        {displayRows.length === 0 && rows.length > 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            {filter === 'unpaid' ? '未入金の方はいません ✓' : '入金済みの方はいません'}
          </div>
        )}

        {displayRows.map(row => {
          const paid = row.status === 'paid';
          const busy = busyId === row.contractor_id;
          return (
            <div
              key={row.contractor_id}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
                paid ? 'border-emerald-300' : 'border-slate-200'
              }`}
            >
              {/* 名前・金額エリア */}
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
                  </div>
                  {paid && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                      <Check size={15} strokeWidth={3} /> 済み
                    </span>
                  )}
                </div>
              </div>

              {/* アクションエリア */}
              <div className="px-3 pb-3">
                {!paid ? (
                  /* 未入金：入金ボタン（大） + 連絡ボタン */
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggle(row, 'paid')}
                      disabled={busy}
                      className="w-full bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ minHeight: '54px' }}
                    >
                      {busy
                        ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        : <Check size={20} strokeWidth={3} />
                      }
                      入金済みにする
                    </button>
                    <button
                      onClick={() => openReminder(row)}
                      className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-medium hover:bg-slate-50"
                    >
                      <Bell size={15} /> 連絡する・督促文を送る
                    </button>
                  </div>
                ) : (
                  /* 入金済み：領収書（大）+ 車庫証明 + 取消 */
                  <div className="flex flex-col gap-2">
                    {/* 領収書 — 実務で最も使うので大きく */}
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
                      onClick={() => toggle(row, 'unpaid')}
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
        })}
      </div>

      {/* 督促モーダル */}
      {reminder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:mx-4 p-5 max-h-[90dvh] overflow-y-auto modal-scroll">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">{reminder.contractor_name} さんへ連絡</h3>
              <button onClick={() => setReminder(null)}
                className="flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 w-11 h-11">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {reminder.phone && (
                <a href={`tel:${reminder.phone}`}
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold text-base hover:bg-emerald-700">
                  <Phone size={20} /> 電話する　{reminder.phone}
                </a>
              )}
              {reminder.email && (
                <a href={`mailto:${reminder.email}?subject=${encodeURIComponent(`【${year}年${month}月分】駐車場使用料のご確認`)}&body=${encodeURIComponent(reminderText)}`}
                  className="flex items-center justify-center gap-2 bg-slate-700 text-white py-4 rounded-xl font-bold text-base hover:bg-slate-800">
                  <Mail size={18} /> メールを送る
                </a>
              )}
              {!reminder.phone && !reminder.email && (
                <p className="text-sm text-slate-500 text-center py-3 bg-slate-50 rounded-xl">連絡先が登録されていません</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-600">督促文（コピーして使用）</label>
                <button onClick={copyText}
                  className="flex items-center gap-1 text-sm text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                  <Copy size={13} /> {copied ? 'コピーしました' : 'コピー'}
                </button>
              </div>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                {reminderText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
