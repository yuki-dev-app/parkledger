import Link from 'next/link';
import { Phone, MessageSquare, AlertTriangle, CheckCircle2, ChevronRight, Car, Users, CreditCard } from 'lucide-react';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getData() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    garages,
    contractorCount,
    unpaidContractors,
    expiringContractors,
    newInquiries,
  ] = await Promise.all([
    sql`SELECT status FROM garages`,
    sql`SELECT COUNT(*) AS n FROM contractors WHERE archived_at = ''`,

    // 未入金の人の名前・電話番号まで取得
    sql`
      SELECT c.name, c.phone, g.number AS garage_number, g.monthly_fee
      FROM contractors c
      JOIN garages g ON g.id = c.garage_id
      LEFT JOIN payments p ON p.contractor_id = c.id AND p.year_month = ${ym}
      WHERE c.archived_at = ''
        AND LEFT(c.contract_start, 7) <= ${ym}
        AND (c.contract_end = '' OR LEFT(c.contract_end, 7) >= ${ym})
        AND (p.id IS NULL OR p.status != 'paid')
      ORDER BY LENGTH(g.number), g.number
    `,

    // 契約が30日以内に終わる人
    sql`
      SELECT c.name, c.contract_end, g.number AS garage_number
      FROM contractors c
      JOIN garages g ON g.id = c.garage_id
      WHERE c.archived_at = ''
        AND c.contract_end != ''
        AND c.contract_end >= ${today}
        AND c.contract_end <= ${in30days}
      ORDER BY c.contract_end
      LIMIT 5
    `,

    // 新着の問い合わせ
    sql`
      SELECT name, created_at FROM inquiries WHERE status = 'new'
      ORDER BY created_at DESC LIMIT 5
    `,
  ]);

  type UnpaidRow = { name: string; phone: string; garage_number: string; monthly_fee: number };
  type ExpiringRow = { name: string; contract_end: string; garage_number: string };
  type InquiryRow = { name: string; created_at: string };

  const g = garages as { status: string }[];
  return {
    vacant:      g.filter(x => x.status === 'vacant').length,
    total:       g.length,
    contractors: Number((contractorCount[0] as { n: string | number }).n),
    unpaid:      unpaidContractors as UnpaidRow[],
    expiring:    expiringContractors as ExpiringRow[],
    inquiries:   newInquiries as InquiryRow[],
    month:       now.getMonth() + 1,
    day:         now.getDate(),
    week:        ['日','月','火','水','木','金','土'][now.getDay()],
    ym,
  };
}

export default async function HomePage() {
  const d = await getData();
  const hasActions = d.unpaid.length > 0 || d.inquiries.length > 0 || d.expiring.length > 0;
  const allPaid = d.unpaid.length === 0;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* 日付 */}
      <div>
        <p className="text-sm text-slate-400">{d.month}月{d.day}日（{d.week}）</p>
        <h1 className="text-xl font-bold text-slate-900 mt-0.5">今日の状況</h1>
      </div>

      {/* ── 全員OK のとき ── */}
      {!hasActions && d.total > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={30} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-800">{d.month}月は問題ありません</p>
            <p className="text-sm text-emerald-700 mt-0.5">全員の入金が確認できました</p>
          </div>
        </div>
      )}

      {/* ── 未入金の人 ── */}
      {d.unpaid.length > 0 && (
        <div className="bg-white border-2 border-red-400 rounded-2xl overflow-hidden">
          <div className="bg-red-500 px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-white" />
            <p className="text-white font-bold text-base">
              入金がまだの方（{d.unpaid.length}名）
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {d.unpaid.map((c, i) => (
              <div key={i} className="px-4 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-lg leading-tight">{c.name} さん</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {c.garage_number}番区画　¥{c.monthly_fee.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {c.phone ? (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-3 rounded-xl font-bold text-sm active:bg-red-600"
                    >
                      <Phone size={16} /> 電話する
                    </a>
                  ) : (
                    <Link
                      href="/payments"
                      className="flex items-center gap-1.5 bg-slate-700 text-white px-4 py-3 rounded-xl font-bold text-sm"
                    >
                      確認する
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <Link
              href="/payments"
              className="flex items-center justify-center gap-2 w-full border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              入金チェック画面を開く <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* ── 契約が切れそうな人 ── */}
      {d.expiring.length > 0 && (
        <div className="bg-white border-2 border-amber-400 rounded-2xl overflow-hidden">
          <div className="bg-amber-400 px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-white" />
            <p className="text-white font-bold text-base">
              契約の期限が近い方（{d.expiring.length}名）
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {d.expiring.map((c, i) => (
              <div key={i} className="px-4 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-base">{c.name} さん</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {c.garage_number}番区画　{c.contract_end} まで
                  </p>
                </div>
                <Link
                  href="/contractors"
                  className="bg-amber-500 text-white px-4 py-3 rounded-xl font-bold text-sm shrink-0 active:bg-amber-600"
                >
                  確認する
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 新着問い合わせ ── */}
      {d.inquiries.length > 0 && (
        <div className="bg-white border-2 border-blue-400 rounded-2xl overflow-hidden">
          <div className="bg-blue-500 px-4 py-3 flex items-center gap-2">
            <MessageSquare size={18} className="text-white" />
            <p className="text-white font-bold text-base">
              問い合わせが届いています（{d.inquiries.length}件）
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {d.inquiries.map((inq, i) => (
              <div key={i} className="px-4 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-base">{inq.name} さんから</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {new Date(inq.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <Link
                  href="/inquiries"
                  className="bg-blue-500 text-white px-4 py-3 rounded-xl font-bold text-sm shrink-0 active:bg-blue-600"
                >
                  返答する
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 概要（下部のシンプルサマリー） ── */}
      {d.total > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Link href="/garages"
            className="bg-white border border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 active:bg-slate-100"
          >
            <Car size={20} className="text-slate-500 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900 tabular-nums">{d.vacant}</p>
            <p className="text-xs text-slate-500 mt-0.5">空き区画</p>
            <p className="text-[11px] text-slate-400">全{d.total}区画</p>
          </Link>
          <Link href="/contractors"
            className="bg-white border border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 active:bg-slate-100"
          >
            <Users size={20} className="text-slate-500 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900 tabular-nums">{d.contractors}</p>
            <p className="text-xs text-slate-500 mt-0.5">契約者</p>
            <p className="text-[11px] text-slate-400">名</p>
          </Link>
          <Link href="/payments"
            className={`border rounded-2xl p-4 text-center active:scale-95 transition-transform ${
              allPaid
                ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                : 'bg-red-50 border-red-200 hover:bg-red-100'
            }`}
          >
            <CreditCard size={20} className={`mx-auto mb-1.5 ${allPaid ? 'text-emerald-500' : 'text-red-500'}`} />
            <p className={`text-2xl font-black tabular-nums ${allPaid ? 'text-emerald-700' : 'text-red-600'}`}>
              {d.unpaid.length}
            </p>
            <p className={`text-xs mt-0.5 ${allPaid ? 'text-emerald-600' : 'text-red-600'}`}>未入金</p>
            <p className="text-[11px] text-slate-400">{d.month}月分</p>
          </Link>
        </div>
      )}

      {/* データなし */}
      {d.total === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-slate-500 text-base mb-2">まだ区画が登録されていません</p>
          <Link href="/garages" className="text-base text-blue-600 font-bold underline">
            区画を登録する →
          </Link>
        </div>
      )}
    </div>
  );
}
