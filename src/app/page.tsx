import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Phone, MessageSquare, AlertTriangle, CheckCircle2, ChevronRight, Car, Users, CreditCard, Settings, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now   = new Date();
  const ym    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);
  const in30  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // RLS が自動的に自分のorgのデータだけ返す
  const [
    { data: garages },
    { data: contractors },
    { data: payments },
    { data: newInquiries },
    settings,
  ] = await Promise.all([
    supabase.from('garages').select('status'),
    supabase.from('contractors').select('id, name, phone, contract_start, contract_end, garages!inner(number, monthly_fee)').eq('archived_at', ''),
    supabase.from('payments').select('contractor_id, status, paid_date').eq('year_month', ym),
    supabase.from('inquiries').select('name, created_at').eq('status', 'new').order('created_at', { ascending: false }).limit(5),
    getSettings(supabase),
  ]);

  // 初回セットアップ判定：区画がゼロの場合はセットアップガイドを表示
  const isFirstTime = !garages || garages.length === 0;
  const hasBusinessInfo = !!(settings as { business_name?: string })?.business_name;

  const payMap      = new Map((payments ?? []).map(p => [p.contractor_id, p]));
  const activeConts = (contractors ?? []).filter(c => {
    const s = c.contract_start?.slice(0, 7);
    const e = c.contract_end?.slice(0, 7) || '';
    return s <= ym && (!e || e >= ym);
  });

  const unpaid = activeConts.filter(c => {
    const p = payMap.get(c.id);
    return !p || p.status !== 'paid';
  }).map(c => ({
    name:          c.name as string,
    phone:         c.phone as string,
    garage_number: (c.garages as unknown as { number: string }).number,
    monthly_fee:   (c.garages as unknown as { monthly_fee: number }).monthly_fee,
  }));

  const expiring = (contractors ?? []).filter(c => c.contract_end && c.contract_end >= today && c.contract_end <= in30)
    .map(c => ({ name: c.name as string, contract_end: c.contract_end as string, garage_number: (c.garages as unknown as { number: string }).number }));

  const g          = garages ?? [];
  const vacant     = g.filter(x => (x as { status: string }).status === 'vacant').length;
  const total      = g.length;
  const month      = now.getMonth() + 1;
  const day        = now.getDate();
  const week       = ['日','月','火','水','木','金','土'][now.getDay()];
  const allPaid    = unpaid.length === 0;
  const hasActions = unpaid.length > 0 || (newInquiries?.length ?? 0) > 0 || expiring.length > 0;

  // 初回セットアップ画面
  if (isFirstTime) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div>
          <p className="text-sm text-slate-400">{month}月{day}日（{week}）</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">ようこそ！</h1>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5">
          <p className="text-lg font-bold text-emerald-800 mb-1">はじめに3つの設定をしましょう</p>
          <p className="text-sm text-emerald-700">以下の順番に進んでください</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* STEP 1 */}
          <Link href="/settings" className={`flex items-center gap-4 rounded-2xl border-2 p-4 hover:bg-slate-50 transition-colors ${hasBusinessInfo ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-white'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl ${hasBusinessInfo ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}>
              {hasBusinessInfo ? <CheckCircle2 size={22} /> : '1'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base">事業者情報を入力する</p>
              <p className="text-sm text-slate-500 mt-0.5">領収書・書類に使う名前・住所・電話番号</p>
            </div>
            <ArrowRight size={20} className="text-slate-400 shrink-0" />
          </Link>

          {/* STEP 2 */}
          <Link href="/garages" className="flex items-center gap-4 rounded-2xl border-2 border-slate-300 bg-white p-4 hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0 font-black text-xl">2</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base">駐車区画を登録する</p>
              <p className="text-sm text-slate-500 mt-0.5">「まとめて追加」で1〜20番など一気に登録できます</p>
            </div>
            <ArrowRight size={20} className="text-slate-400 shrink-0" />
          </Link>

          {/* STEP 3 */}
          <Link href="/contractors" className="flex items-center gap-4 rounded-2xl border-2 border-slate-300 bg-white p-4 hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0 font-black text-xl">3</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-base">契約者を登録する</p>
              <p className="text-sm text-slate-500 mt-0.5">氏名・電話番号・契約期間などを入力します</p>
            </div>
            <ArrowRight size={20} className="text-slate-400 shrink-0" />
          </Link>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-800 mb-1">💡 ヒント</p>
          <p className="text-sm text-amber-700">STEP2の区画追加で「まとめて追加」ボタンを使うと、1番〜20番などをまとめて登録できます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <p className="text-sm text-slate-400">{month}月{day}日（{week}）</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">今日の状況</h1>
      </div>

      {!hasActions && total > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={30} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-800">{month}月は問題ありません</p>
            <p className="text-sm text-emerald-700 mt-0.5">全員の入金が確認できました</p>
          </div>
        </div>
      )}

      {unpaid.length > 0 && (
        <div className="bg-white border-2 border-red-400 rounded-2xl overflow-hidden">
          <div className="bg-red-500 px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-white" />
            <p className="text-white font-bold text-base">入金がまだの方（{unpaid.length}名）</p>
          </div>
          <div className="divide-y divide-slate-100">
            {unpaid.slice(0, 2).map((c, i) => (
              <div key={i} className="px-4 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 text-lg">{c.name} さん</p>
                  <p className="text-sm text-slate-500 mt-0.5">{c.garage_number}番区画　¥{c.monthly_fee.toLocaleString()}</p>
                </div>
                {c.phone ? (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-3 rounded-xl font-bold text-sm shrink-0">
                    <Phone size={16} /> 電話する
                  </a>
                ) : (
                  <Link href="/payments" className="flex items-center gap-1.5 bg-slate-700 text-white px-4 py-3 rounded-xl font-bold text-sm shrink-0">確認する</Link>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <Link href="/payments" className="flex items-center justify-center gap-2 w-full bg-red-50 border border-red-200 text-red-700 py-3 rounded-xl text-sm font-bold hover:bg-red-100">
              {unpaid.length > 2 ? `他 ${unpaid.length - 2} 名を含む — 入金チェックへ` : '入金チェック画面を開く'}
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {expiring.length > 0 && (
        <div className="bg-white border-2 border-amber-400 rounded-2xl overflow-hidden">
          <div className="bg-amber-400 px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-white" />
            <p className="text-white font-bold text-base">契約の期限が近い方（{expiring.length}名）</p>
          </div>
          <div className="divide-y divide-slate-100">
            {expiring.map((c, i) => (
              <div key={i} className="px-4 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 text-base">{c.name} さん</p>
                  <p className="text-sm text-amber-700 mt-0.5">{c.garage_number}番区画　{c.contract_end} まで</p>
                </div>
                <Link href="/contractors" className="bg-amber-500 text-white px-4 py-3 rounded-xl font-bold text-sm shrink-0">確認する</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {(newInquiries?.length ?? 0) > 0 && (
        <div className="bg-white border-2 border-blue-400 rounded-2xl overflow-hidden">
          <div className="bg-blue-500 px-4 py-3 flex items-center gap-2">
            <MessageSquare size={18} className="text-white" />
            <p className="text-white font-bold text-base">問い合わせが届いています（{newInquiries?.length}件）</p>
          </div>
          <div className="divide-y divide-slate-100">
            {newInquiries?.map((inq, i) => (
              <div key={i} className="px-4 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 text-base">{inq.name} さんから</p>
                  <p className="text-sm text-slate-500 mt-0.5">{String(inq.created_at).slice(0, 10)}</p>
                </div>
                <Link href="/inquiries" className="bg-blue-500 text-white px-4 py-3 rounded-xl font-bold text-sm shrink-0">返答する</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Link href="/garages" className="bg-white border border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50">
            <Car size={20} className="text-slate-500 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900 tabular-nums">{vacant}</p>
            <p className="text-xs text-slate-500 mt-0.5">空き区画</p>
            <p className="text-xs text-slate-400">全{total}区画</p>
          </Link>
          <Link href="/contractors" className="bg-white border border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50">
            <Users size={20} className="text-slate-500 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900 tabular-nums">{contractors?.length ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">契約者</p>
            <p className="text-xs text-slate-400">名</p>
          </Link>
          <Link href="/payments" className={`border rounded-2xl p-4 text-center ${allPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <CreditCard size={20} className={`mx-auto mb-1.5 ${allPaid ? 'text-emerald-500' : 'text-red-500'}`} />
            <p className={`text-2xl font-black tabular-nums ${allPaid ? 'text-emerald-700' : 'text-red-600'}`}>{unpaid.length}</p>
            <p className={`text-xs mt-0.5 ${allPaid ? 'text-emerald-600' : 'text-red-600'}`}>未入金</p>
            <p className="text-xs text-slate-400">{month}月分</p>
          </Link>
        </div>
      )}

      {total === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-slate-500 text-base mb-2">まだ区画が登録されていません</p>
          <Link href="/garages" className="text-base text-blue-600 font-bold underline">区画を登録する →</Link>
        </div>
      )}
    </div>
  );
}
