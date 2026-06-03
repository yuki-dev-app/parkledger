/**
 * 共通スタイル定数
 *
 * 各ページで同じ文字列を個別定義していた inputCls を一元管理。
 * デザインを変更する際はここだけ修正すれば全ページに反映される。
 */

/** フォーム入力欄の共通スタイル（py-3.5 バージョン） */
export const inputCls =
  'border border-slate-300 rounded-xl px-4 py-3.5 w-full ' +
  'focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white text-base';

/** フォーム入力欄のコンパクト版（py-3 バージョン・モーダル内など） */
export const inputClsSm =
  'border border-slate-300 rounded-xl px-3 py-3 w-full ' +
  'focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white text-base';
