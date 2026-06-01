import Link from 'next/link';
import { Car, Users, CreditCard, MessageSquare, AlertTriangle } from 'lucide-react';
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
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  const cards = [
    {
      href: '/garages',
      icon: Car,
      label: '空き区画',
      value: `${stats.vacant} 区画`,
      sub: `全 ${stats.total} 区画中`,
      color: 'bg-emerald-600',
      alert: stats.total > 0 && stats.vacant === 0,
      alertLabel: '満車',
    },
    {
      href: '/contractors',
      icon: Users,
      label: '契約者数',
      value: `${stats.contractorCount} 名`,
      sub: stats.expiringCount > 0 ? `更新期限 ${stats.expiringCount} 名` : '契約中',
      color: 'bg-slate-600',
      alert: stats.expiringCount > 0,
      alertLabel: `期限近い ${stats.expiringCount}名`,
    },
    {
      href: '/payments',
      icon: CreditCard,
      label: '今月の未入金',
      value: `${stats.unpaidCount} 件`,
      sub: `${now.getMonth() + 1}月分`,
      color: stats.unpaidCount > 0 ? 'bg-red-500' : 'bg-emerald-600',
      alert: stats.unpaidCount > 0,
      alertLabel: '要確認',
    },
    {
      href: '/inquiries',
      icon: MessageSquare,
      label: '新着問い合わせ',
      value: `${stats.newInquiries} 件`,
      sub: '未対応',
      color: stats.newInquiries > 0 ? 'bg-amber-500' : 'bg-slate-600',
      alert: stats.newInquiries > 0,
      alertLabel: '未対応',
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-slate-400">{dateStr}</p>
        <h2 className="text-2xl font-bold text-slate-900">ダッシュボード</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {cards.map(({ href, icon: Icon, label, value, sub, color, alert, alertLabel }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col gap-3 hover:shadow-md active:scale-[0.98] transition-all relative overflow-hidden"
          >
            {alert && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-0.5">
                <AlertTriangle size={11} /> {alertLabel}
              </span>
            )}
            <div className={`${color} text-white rounded-xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shadow`}>
              <Icon size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-sm md:text-base text-slate-500 font-medium">{label}</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{value}</p>
              <p className={`text-xs md:text-sm mt-0.5 ${alert ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {stats.total > 0 && (
        <div className="mt-4 bg-slate-100 border border-slate-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-slate-700">
            {now.getMonth() + 1}月の状況：
            {stats.unpaidCount === 0
              ? ' 全員入金済です ✓'
              : ` 未入金が ${stats.unpaidCount} 件あります。入金チェックで確認してください。`}
          </p>
        </div>
      )}
    </div>
  );
}
