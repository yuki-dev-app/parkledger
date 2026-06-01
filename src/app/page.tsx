import Link from 'next/link';
import { Car, Users, CreditCard, MessageSquare, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getStats() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [garages, contractors, paidRows, inquiries] = await Promise.all([
    sql`SELECT status FROM garages`,
    sql`SELECT contract_end FROM contractors WHERE archived_at = ''`,
    sql`SELECT COUNT(*) AS n FROM payments WHERE year_month = ${ym} AND status = 'paid'`,
    sql`SELECT status FROM inquiries`,
  ]);

  const paidCount = Number((paidRows[0] as { n: string | number }).n);
  const contractorCount = contractors.length;

  return {
    vacant:          (garages as { status: string }[]).filter(g => g.status === 'vacant').length,
    occupied:        (garages as { status: string }[]).filter(g => g.status === 'occupied').length,
    total:           garages.length,
    contractorCount,
    paidCount,
    unpaidCount:     Math.max(0, contractorCount - paidCount),
    newInquiries:    (inquiries as { status: string }[]).filter(i => i.status === 'new').length,
    expiringCount:   (contractors as { contract_end: string }[]).filter(c =>
      c.contract_end && c.contract_end >= today && c.contract_end <= in30days
    ).length,
    ym,
  };
}

export default async function HomePage() {
  const s = await getStats();
  const now = new Date();
  const month = now.getMonth() + 1;
  const allGood = s.unpaidCount === 0 && s.newInquiries === 0 && s.expiringCount === 0;
  const paymentRate = s.contractorCount > 0 ? Math.round((s.paidCount / s.contractorCount) * 100) : 0;
  const occupancyRate = s.total > 0 ? Math.round((s.occupied / s.total) * 100) : 0;

  return (
    <div className="space-y-3">

      {/* ── ページヘッダー ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">ダッシュボード</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {now.getFullYear()}年{month}月{now.getDate()}日（{['日','月','火','水','木','金','土'][now.getDay()]}）
          </p>
        </div>
        {allGood && s.total > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            <CheckCircle2 size={12} /> 問題なし
          </span>
        )}
      </div>

      {/* ── KPI カード 2×2 ── */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">

        {/* 空き区画 */}
        <Link href="/garages"
          className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-l-2xl" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
              <Car size={15} className="text-emerald-600" />
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-0.5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-0.5">空き区画</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[32px] font-black text-slate-900 leading-none tabular-nums">{s.vacant}</span>
              <span className="text-xs text-slate-400 font-medium">/ {s.total}</span>
            </div>
            {/* 稼働率バー */}
            <div className="mt-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400">稼働率</span>
                <span className="text-[10px] font-medium text-slate-600">{occupancyRate}%</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>
        </Link>

        {/* 契約者数 */}
        <Link href="/contractors"
          className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl ${s.expiringCount > 0 ? 'bg-amber-400' : 'bg-slate-300'}`} />
          <div className="flex items-start justify-between mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.expiringCount > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-100'}`}>
              <Users size={15} className={s.expiringCount > 0 ? 'text-amber-600' : 'text-slate-500'} />
            </div>
            {s.expiringCount > 0
              ? <span className="flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
                  <AlertTriangle size={9} /> {s.expiringCount}名
                </span>
              : <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-0.5" />
            }
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-0.5">契約者数</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[32px] font-black text-slate-900 leading-none tabular-nums">{s.contractorCount}</span>
              <span className="text-xs text-slate-400 font-medium">名</span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${s.expiringCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {s.expiringCount > 0 ? `期限 ${s.expiringCount}名が30日以内` : '期限切れなし'}
            </p>
          </div>
        </Link>

        {/* 今月の未入金 */}
        <Link href="/payments"
          className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl ${s.unpaidCount > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
          <div className="flex items-start justify-between mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.unpaidCount > 0 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
              <CreditCard size={15} className={s.unpaidCount > 0 ? 'text-red-500' : 'text-emerald-600'} />
            </div>
            {s.unpaidCount > 0
              ? <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-medium">要確認</span>
              : <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">完了</span>
            }
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-0.5">今月の未入金</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-[32px] font-black leading-none tabular-nums ${s.unpaidCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {s.unpaidCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">件</span>
            </div>
            {/* 入金進捗バー */}
            <div className="mt-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400">{month}月の入金率</span>
                <span className={`text-[10px] font-medium ${paymentRate === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>{paymentRate}%</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${paymentRate === 100 ? 'bg-emerald-500' : 'bg-red-400'}`}
                  style={{ width: `${paymentRate}%` }}
                />
              </div>
            </div>
          </div>
        </Link>

        {/* 新着問い合わせ */}
        <Link href="/inquiries"
          className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl ${s.newInquiries > 0 ? 'bg-amber-400' : 'bg-slate-300'}`} />
          <div className="flex items-start justify-between mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.newInquiries > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-100'}`}>
              <MessageSquare size={15} className={s.newInquiries > 0 ? 'text-amber-600' : 'text-slate-400'} />
            </div>
            {s.newInquiries > 0
              ? <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">未対応</span>
              : <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-0.5" />
            }
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-0.5">新着問い合わせ</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-[32px] font-black leading-none tabular-nums ${s.newInquiries > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {s.newInquiries}
              </span>
              <span className="text-xs text-slate-400 font-medium">件</span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${s.newInquiries > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {s.newInquiries > 0 ? '返信が必要です' : '対応済み'}
            </p>
          </div>
        </Link>
      </div>

      {/* ── 今月サマリー ── */}
      {s.total > 0 && (
        <div className={`rounded-2xl px-4 py-3 border text-sm flex items-center gap-2 ${
          allGood
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {allGood
            ? <CheckCircle2 size={15} className="shrink-0" />
            : <AlertTriangle size={15} className="shrink-0" />
          }
          <span className="font-medium">
            {allGood
              ? `${month}月は全員入金済みです。問題ありません。`
              : [
                  s.unpaidCount > 0 && `未入金 ${s.unpaidCount} 件`,
                  s.newInquiries > 0 && `新着問い合わせ ${s.newInquiries} 件`,
                  s.expiringCount > 0 && `期限間近 ${s.expiringCount} 名`,
                ].filter(Boolean).join('　·　')
            }
          </span>
        </div>
      )}
    </div>
  );
}
