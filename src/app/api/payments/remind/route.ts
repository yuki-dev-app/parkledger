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

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from('reminder_logs')
    .insert({
      org_id: orgId,
      contractor_id: Number(contractor_id),
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

  // 各契約者について当月の最終督促日を返す
  const { data, error } = await supabase
    .from('reminder_logs')
    .select('contractor_id, reminded_at, method')
    .eq('year_month', ym)
    .order('reminded_at', { ascending: false });

  if (error) return NextResponse.json([]);

  // contractor_id ごとに最新の督促だけを返す
  const latest = new Map<number, { reminded_at: string; count: number }>();
  for (const r of data ?? []) {
    const id = r.contractor_id as number;
    if (!latest.has(id)) {
      // count は全ログを後で集計するのでここでは1固定
      latest.set(id, { reminded_at: r.reminded_at as string, count: 1 });
    } else {
      latest.get(id)!.count++;
    }
  }

  return NextResponse.json(
    Array.from(latest.entries()).map(([contractor_id, v]) => ({ contractor_id, ...v })),
    { headers: NO_CACHE_HEADERS }
  );
}
