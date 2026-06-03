'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';
import { SkeletonList } from '@/components/Skeleton';

type MonthData = { ym: string; label: string; year: string; paid: number; unpaid: number; total: number };

export default function AnalyticsPage() {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setMonths(d.months ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const maxTotal = Math.max(...months.map(m => m.total), 1);
  const totalPaid   = months.reduce((s, m) => s + m.paid, 0);
  const totalUnpaid = months.reduce((s, m) => s + m.unpaid, 0);
  const avgMonthly  = months.length > 0 ? Math.round(totalPaid / months.filter(m => m.paid > 0).length || 0) : 0;

  // 前月比
  const last = months[months.length - 1];
  const prev = months[months.length - 2];
  const diff = last && prev && prev.paid > 0
    ? Math.round((last.paid - prev.paid) / prev.paid * 100)
    : null;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* ヘッダー */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={22} className="text-slate-600 dark:text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">年間収入分析</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">過去12ヶ月の入金状況</p>
      </div>

      {loading ? (
        <SkeletonList count={4} lines={3} />
      ) : (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">12ヶ月合計</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
                ¥{(totalPaid / 10000).toFixed(0)}<span className="text-xs font-normal text-slate-500 dark:text-slate-400">万</span>
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">月平均（入金済）</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
                ¥{(avgMonthly / 10000).toFixed(1)}<span className="text-xs font-normal text-slate-500 dark:text-slate-400">万</span>
              </p>
            </div>
            <div className={`rounded-2xl border shadow-sm p-3 text-center ${
              diff === null ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              : diff >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200'
            }`}>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">前月比</p>
              <p className={`text-lg font-black tabular-nums leading-tight ${
                diff === null ? 'text-slate-400 dark:text-slate-500'
                : diff >= 0 ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
              }`}>
                {diff === null ? '—' : `${diff >= 0 ? '+' : ''}${diff}%`}
              </p>
            </div>
          </div>

          {/* 棒グラフ */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                月別入金額
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />入金済</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-200 inline-block" />未入金</span>
              </div>
            </div>

            {/* グラフ本体 */}
            <div className="flex items-end gap-1.5 h-40">
              {months.map(m => {
                const paidH   = maxTotal > 0 ? (m.paid   / maxTotal) * 100 : 0;
                const unpaidH = maxTotal > 0 ? (m.unpaid / maxTotal) * 100 : 0;
                const isCurrentMonth = m.ym === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                return (
                  <div key={m.ym} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end gap-px" style={{ height: '120px' }}>
                      {m.unpaid > 0 && (
                        <div
                          className="w-full bg-red-200 rounded-t-sm"
                          style={{ height: `${unpaidH}%`, minHeight: m.unpaid > 0 ? '3px' : 0 }}
                          title={`未入金: ¥${m.unpaid.toLocaleString()}`}
                        />
                      )}
                      {m.paid > 0 && (
                        <div
                          className={`w-full rounded-t-sm ${isCurrentMonth ? 'bg-emerald-600' : 'bg-emerald-400'}`}
                          style={{ height: `${paidH}%`, minHeight: m.paid > 0 ? '3px' : 0 }}
                          title={`入金済: ¥${m.paid.toLocaleString()}`}
                        />
                      )}
                      {m.total === 0 && (
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-sm" style={{ height: '4px' }} />
                      )}
                    </div>
                    <p className={`text-xs tabular-nums ${isCurrentMonth ? 'font-bold text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}
                      style={{ fontSize: '10px' }}>
                      {m.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 最大金額ガイド */}
            <p className="text-right text-xs text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
              最大: ¥{maxTotal.toLocaleString()}
            </p>
          </div>

          {/* 月別明細テーブル */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-700 dark:text-slate-300 text-sm">月別明細</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {[...months].reverse().map(m => (
                <div key={m.ym} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.year}年{m.label}</p>
                    {m.unpaid > 0 && (
                      <p className="text-xs text-red-500 mt-0.5">未入金 ¥{m.unpaid.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-900 dark:text-slate-100 tabular-nums text-base">
                      ¥{m.paid.toLocaleString()}
                    </p>
                    {m.total > 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                        / ¥{m.total.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">12ヶ月合計（入金済）</p>
              <p className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums text-lg">¥{totalPaid.toLocaleString()}</p>
            </div>
          </div>

          {totalUnpaid > 0 && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>未回収合計: ¥{totalUnpaid.toLocaleString()}</strong>
                　— 入金チェック画面で確認・督促できます
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
