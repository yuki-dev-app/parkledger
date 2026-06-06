import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { contractor_id, year_month, method = 'other' } = body;

  if (!contractor_id || !year_month)
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });

  // Bug15修正: NaNチェックを追加（Number("abc") = NaN がDBに渡るのを防ぐ）
  const contractorIdNum = parseInt(String(contractor_id), 10);
  if (isNaN(contractorIdNum) || contractorIdNum <= 0)
    return NextResponse.json({ error: '無効な contractor_id です' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from('reminder_logs')
    .insert({
      org_id: orgId,
      contractor_id: contractorIdNum,
      year_month,
      reminded_at: today,
      method,
    });

  if (error) return NextResponse.json({ error: '記録に失敗しました' }, { status: 500 });
  return NextResponse.json({ ok: true, reminded_at: today });
}

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const ym = new URL(req.url).searchParams.get('year_month');
  if (!ym) return NextResponse.json({ error: 'year_month が必要です' }, { status: 400 });

  const { data, error } = await supabase
    .from('reminder_logs')
    .select('contractor_id, reminded_at')
    .eq('year_month', ym)
    .order('reminded_at', { ascending: false });

  if (error) return NextResponse.json([], { headers: NO_CACHE_HEADERS });

  // Bug8修正: contractor_idごとに「最新の督促日」と「総督促回数」を明確に分離して集計
  const countMap  = new Map<number, number>();          // 全件カウント
  const latestMap = new Map<number, string>();           // 最新日（降順なので最初が最新）

  for (const r of data ?? []) {
    const id  = r.contractor_id as number;
    const dat = r.reminded_at as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
    if (!latestMap.has(id)) latestMap.set(id, dat);    // 最初 = 最新
  }

  const result = Array.from(countMap.entries()).map(([contractor_id, count]) => ({
    contractor_id,
    reminded_at: latestMap.get(contractor_id) ?? '',
    count,
  }));

  return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
}
