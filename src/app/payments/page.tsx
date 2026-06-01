'use client';
import { useEffect, useState, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight, Download, FileText, Undo2, Bell, Copy, X, Phone, Mail, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/Toast';

type Row = {
  contractor_id: number;
  contractor_name: string;
  garage_number: string;
  amount: number;
  payment_id: number | null;
  status: 'paid' | 'unpaid' | 'late';
  paid_date: string;
};

type ReminderData = {
  name: string;
  phone: string;
  email: string;
  amount: number;
  garage_number: string;
};

type Settings = {
  business_name: string;
  business_phone: string;
  parking_name: string;
};

export default function PaymentsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [reminder, setReminder] = useState<{ row: Row; info: ReminderData } | null>(null);
  const [settings, setSettings] = useState<Settings>({ business_name: '', business_phone: '', parking_name: '' });
  const [copied, setCopied] = useState(false);

  const ym = `${year}-${String(month).padStart(2, '0')}`;

  const load = useCallback(async () => {
    const [pRes, sRes] = await Promise.all([
      fetch(`/api/payments?year_month=${ym}`),
      fetch('/api/settings'),
    ]);
    setRows(await pRes.json());
    setSettings(await sRes.json());
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
    setToast({
      message: next === 'paid' ? `${row.contractor_name} さんを入金済にしました` : '未入金に戻しました',
      kind: 'success',
    });
    load();
  };

  const openReminder = async (row: Row) => {
    const cRes = await fetch('/api/contractors');
    const cs = await cRes.json();
    const c = cs.find((x: { id: number; phone?: string; email?: string }) => x.id === row.contractor_id);
    setReminder({
      row,
      info: {
        name: row.contractor_name,
        phone: c?.phone || '',
        email: c?.email || '',
        amount: row.amount,
        garage_number: row.garage_number,
      },
    });
    setCopied(false);
  };

  const reminderText = reminder ? `${reminder.info.name} 様

平素よりお世話になっております。
${settings.parking_name || '駐車場'}の管理者${settings.business_name ? '、' + settings.business_name : ''}です。

${year}年${month}月分の駐車場使用料（¥${reminder.info.amount.toLocaleString()}）の
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

  const paidCount = rows.filter(r => r.status === 'paid').length;
  const unpaidCount = rows.length - paidCount;
  const total = rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-3">
        <h1 className="text-lg font-bold text-slate-900">入金チェック</h1>
        <p className="text-xs text-slate-400 mt-0.5">入金できた方のボタンを押してください</p>
      </div>

      {/* 月ナビ */}
      <div className="flex items-center justify-between mb-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm px-2 py-1.5">
        <button
          onClick={prevMonth}
          aria-label="前の月"
          className="flex items-center justify-center w-10 h-10 text-slate-500 hover:bg-slate-100 rounded-xl active:bg-slate-200"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="font-bold text-slate-900 text-base">{year}年 {month}月</span>
        <button
          onClick={nextMonth}
          aria-label="次の月"
          className="flex items-center justify-center w-10 h-10 text-slate-500 hover:bg-slate-100 rounded-xl active:bg-slate-200"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{paidCount}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">入金済</p>
        </div>
        <div className={`rounded-2xl p-3 text-center border ${unpaidCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`text-xl font-bold ${unpaidCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>{unpaidCount}</p>
          <p className={`text-[11px] font-medium mt-0.5 ${unpaidCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>未入金</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
          <p className="text-sm font-bold text-slate-700 leading-tight pt-1">¥{total.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">入金合計</p>
        </div>
      </div>

      {/* CSV */}
      {rows.length > 0 && (
        <a
          href={`/api/payments/export?year_month=${ym}`}
          className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl py-2 mb-3 font-medium hover:bg-slate-50 text-xs shadow-sm"
        >
          <Download size={13} /> {year}年{month}月　月次レポート（CSV）
        </a>
      )}

      {/* 一覧 */}
      <div className="flex flex-col gap-2">
        {rows.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CreditCard size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium mb-1">この月の契約者がいません</p>
            <Link href="/contractors" className="text-sm text-slate-700 underline font-medium">契約者を登録する</Link>
          </div>
        )}

        {rows.map(row => {
          const paid = row.status === 'paid';
          const busy = busyId === row.contractor_id;
          return (
            <div
              key={row.contractor_id}
              className={`bg-white rounded-2xl border shadow-sm transition-colors ${paid ? 'border-emerald-200' : 'border-slate-200'}`}
            >
              <div className="p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold shrink-0 border border-slate-200">
                        #{row.garage_number}
                      </span>
                      <span className="font-bold text-slate-900 text-base truncate">{row.contractor_name}</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      ¥{row.amount.toLocaleString()}
                      {paid && row.paid_date && (
                        <span className="text-xs text-emerald-600 ml-2">{row.paid_date} 入金</span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {paid ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                        <Check size={17} strokeWidth={3} /> 済
                      </span>
                    ) : (
                      <button
                        onClick={() => toggle(row, 'paid')}
                        disabled={busy}
                        className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 shadow-sm whitespace-nowrap"
                      >
                        入金済にする
                      </button>
                    )}
                  </div>
                </div>

                {/* 入金済の補助操作 */}
                {paid && (
                  <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
                    {row.payment_id && (
                      <Link
                        href={`/print/receipt/${row.payment_id}`}
                        className="flex items-center justify-center gap-1.5 flex-1 bg-slate-800 text-white py-2 rounded-xl font-medium text-xs hover:bg-slate-700"
                      >
                        <FileText size={13} /> 領収書を発行
                      </Link>
                    )}
                    <button
                      onClick={() => toggle(row, 'unpaid')}
                      disabled={busy}
                      className="flex items-center justify-center gap-1 text-slate-500 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Undo2 size={13} /> 取消
                    </button>
                  </div>
                )}

                {/* 未入金のリマインダー */}
                {!paid && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={() => openReminder(row)}
                      className="flex items-center justify-center gap-1.5 w-full border border-slate-200 text-slate-600 py-2 rounded-xl text-xs font-medium hover:bg-slate-50"
                    >
                      <Bell size={13} /> 入金督促の連絡をする
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* リマインダーモーダル */}
      {reminder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:mx-4 p-4 sm:p-5 max-h-[90dvh] overflow-y-auto modal-scroll">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">{reminder.info.name} さんへの督促</h3>
              <button
                onClick={() => setReminder(null)}
                className="flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 w-10 h-10"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {reminder.info.phone && (
                <a
                  href={`tel:${reminder.info.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700"
                >
                  <Phone size={16} /> {reminder.info.phone}
                </a>
              )}
              {reminder.info.email && (
                <a
                  href={`mailto:${reminder.info.email}?subject=${encodeURIComponent(`【${year}年${month}月分】駐車場使用料のご確認`)}&body=${encodeURIComponent(reminderText)}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800"
                >
                  <Mail size={15} /> メールを送る
                </a>
              )}
              {!reminder.info.phone && !reminder.info.email && (
                <p className="text-sm text-slate-500 text-center flex-1 py-2.5">連絡先が登録されていません</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500">督促文（コピーして使用）</label>
                <button
                  onClick={copyText}
                  className="flex items-center gap-1 text-xs text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50"
                >
                  <Copy size={12} /> {copied ? 'コピー済' : 'コピー'}
                </button>
              </div>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                {reminderText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
