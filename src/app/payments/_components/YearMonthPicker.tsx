'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollLock } from '@/lib/use-scroll-lock';

type Props = {
  year:  number;
  month: number;
  onChange: (year: number, month: number) => void;
};

/** 年月ナビゲーター（月送り矢印 + タップで年月ピッカー） */
export default function YearMonthPicker({ year, month, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  useScrollLock(showPicker);

  const now         = new Date();
  const currentYear = now.getFullYear();
  const isCurrentOrFuture =
    year > currentYear || (year === currentYear && month >= now.getMonth() + 1);

  const prevMonth = () => {
    if (month === 1) onChange(year - 1, 12);
    else             onChange(year, month - 1);
  };
  const nextMonth = () => {
    if (month === 12) onChange(year + 1, 1);
    else              onChange(year, month + 1);
  };

  return (
    <>
      {/* 月ナビ */}
      <div className="flex items-center justify-between mb-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-2 py-1.5">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="前の月"
          className="flex items-center justify-center w-12 h-12 text-slate-600 hover:bg-slate-100 rounded-xl active:bg-slate-200"
        >
          <ChevronLeft size={26} />
        </button>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="font-bold text-slate-900 text-xl px-3 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
          title="月を選ぶ"
        >
          {year}年{month}月
        </button>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="次の月"
          disabled={isCurrentOrFuture}
          className="flex items-center justify-center w-12 h-12 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-100 active:bg-slate-200"
        >
          <ChevronRight size={26} />
        </button>
      </div>

      {/* 年月ピッカー */}
      {showPicker && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-xs sm:mx-4 p-5"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-bold text-slate-900 text-lg mb-4 text-center">年月を選ぶ</p>

            {/* 年 */}
            <div className="flex gap-2 mb-4">
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => onChange(y, month)}
                  className={`flex-1 py-3 rounded-xl font-bold text-base transition-colors ${
                    y === year
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {y}年
                </button>
              ))}
            </div>

            {/* 月 */}
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                const isFuture =
                  year > currentYear ||
                  (year === currentYear && m > now.getMonth() + 1);
                const isSelected = m === month;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={isFuture}
                    onClick={() => { onChange(year, m); setShowPicker(false); }}
                    className={`py-3 rounded-xl font-bold text-base transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : isFuture
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
                    }`}
                  >
                    {m}月
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-full mt-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-base hover:bg-slate-200"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
