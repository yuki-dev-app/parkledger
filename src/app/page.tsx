import Link from 'next/link';
import { Car, Users, CreditCard, MessageSquare, AlertTriangle, TrendingUp } from 'lucide-react';
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

  return {
    vacant:          (garages as { status: string }[]).filter(g => g.status === 'vacant').length,
    total:           garages.length,
    contractorCount: contractors.length,
    unpaidCount:     Math.max(0, contractors.length - paidCount),
    newInquiries:    (inquiries as { status: string }[]).filter(i => i.status === 'new').length,
    expiringCount:   (contractors as { contract_end: string }[]).filter(c =>
      c.contract_end && c.contract_end >= today && c.contract_end <= in30days
    ).length,
    ym,
  };
}

export default async function HomePage() {
  const stats = await getStats();
  const now = new Date();
  const month = now.getMonth() + 1;

  const cards = [
    {
      href: '/garages',
      icon: Car,
      label: '空き区画',
      value: stats.vacant,
      unit: '区画',
      sub: `全 ${stats.total} 区画中`,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-600',
      alert: stats.total > 0 && stats.vacant === 0,
      alertLabel: '満車',
      alertColor: 'bg-blue-500',
    },
    {
      href: '/contractors',
      icon: Users,
      label: '契約者数',
      value: stats.contractorCount,
      unit: '名',
      sub: stats.expiringCount > 0 ? `期限近い ${stats.expiringCount} 名` : '契約中',
      accent: 'text-slate-700',
      bg: 'bg-slate-50',
      iconBg: 'bg-slate-600',
      alert: stats.expiringCount > 0,
      alertLabel: '要確認',
      alertColor: 'bg-amber-500',
    },
    {
      href: '/payments',
      icon: CreditCard,
      label: '今月の未入金',
      value: stats.unpaidCount,
      unit: '件',
      sub: `${month}月分`,
      accent: stats.unpaidCount > 0 ? 'text-red-600' : 'text-emerald-600',
      bg: stats.unpaidCount > 0 ? 'bg-red-50' : 'bg-emerald-50',
      iconBg: stats.unpaidCount > 0 ? 'bg-red-500' : 'bg-emerald-600',
      alert: stats.unpaidCount > 0,
      alertLabel: '要確認',
      alertColor: 'bg-red-500',
    },
    {
      href: '/inquiries',
      icon: MessageSquare,
      label: '新着問い合わせ',
      value: stats.newInquiries,
      unit: '件',
      sub: '未対応',
      accent: stats.newInquiries > 0 ? 'text-amber-600' : 'text-slate-500',
      bg: stats.newInquiries > 0 ? 'bg-amber-50' : 'bg-slate-50',
      iconBg: stats.newInquiries > 0 ? 'bg-amber-500' : 'bg-slate-500',
      alert: stats.newInquiries > 0,
      alertLabel: '未対応',
      alertColor: 'bg-amber-500',
    },
  ];

  const allGood = stats.unpaidCount === 0 && stats.newInquiries === 0 && stats.expiringCount === 0;

  return (
    <div>
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">ダッシュボード</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {now.getFullYear()}年{month}月{now.getDate()}日
          </p>
        </div>
        {allGood && stats.total > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            <TrendingUp size={12} /> 全員入金済
          </span>
        )}
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        {cards.map(({ href, icon: Icon, label, value, unit, sub, accent, bg, iconBg, alert, alertLabel, alertColor }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 md:p-5 flex flex-col gap-2.5 hover:shadow-md active:scale-[0.98] transition-all relative overflow-hidden"
          >
            {alert && (
              <span className={`absolute top-0 right-0 ${alertColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-xl flex items-center gap-0.5`}>
                <AlertTriangle size={9} /> {alertLabel}
              </span>
            )}
            <div className={`${iconBg} text-white rounded-xl w-9 h-9 md:w-11 md:h-11 flex items-center justify-center`}>
              <Icon size={18} className="md:w-5 md:h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
              <p className={`text-2xl md:text-3xl font-bold leading-none ${accent}`}>
                {value}<span className="text-sm font-semibold ml-0.5">{unit}</span>
              </p>
              <p className={`text-xs mt-1 ${alert ? accent : 'text-slate-400'}`}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* 今月サマリー */}
      {stats.total > 0 && (
        <div className={`mt-3 rounded-2xl p-3.5 border text-sm font-medium flex items-center gap-2 ${
          allGood
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <TrendingUp size={15} className="shrink-0" />
          {allGood
            ? `${month}月は全員入金済です。問題はありません。`
            : `${month}月に未入金 ${stats.unpaidCount} 件${stats.newInquiries > 0 ? `・新着問い合わせ ${stats.newInquiries} 件` : ''}があります。`}
        </div>
      )}
    </div>
  );
}
