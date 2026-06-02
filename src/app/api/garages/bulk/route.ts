import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません。いったんログアウトして再度ログインしてください。' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const start       = Math.floor(Number(body.start));
  const end         = Math.floor(Number(body.end));
  const monthly_fee = Math.max(0, Math.min(9_999_999, Number(body.monthly_fee) || 0));
  const notes       = (typeof body.notes === 'string' ? body.notes.trim() : '').slice(0, 500);

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
    return NextResponse.json({ error: '番号の範囲が正しくありません' }, { status: 400 });
  }
  if (end - start + 1 > 100) {
    return NextResponse.json({ error: '一度に追加できるのは100区画までです' }, { status: 400 });
  }

  const numbers = Array.from({ length: end - start + 1 }, (_, i) => String(start + i));

  // 既存の番号を調べて重複をスキップ
  const { data: existing } = await supabase
    .from('garages')
    .select('number')
    .in('number', numbers);

  const existingSet = new Set(existing?.map(g => g.number) ?? []);
  const toInsert = numbers
    .filter(n => !existingSet.has(n))
    .map(n => ({ number: n, status: 'vacant', monthly_fee, notes, org_id: orgId }));

  if (toInsert.length === 0) {
    return NextResponse.json({ added: 0, skipped: numbers.length });
  }

  const { error } = await supabase.from('garages').insert(toInsert);
  if (error) return NextResponse.json({ error: '追加に失敗しました' }, { status: 500 });

  return NextResponse.json({ added: toInsert.length, skipped: existingSet.size });
}
