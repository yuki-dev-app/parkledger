import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data } = await supabase
    .from('cleaning_logs')
    .select('*')
    .order('cleaned_date', { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません。いったんログアウトして再度ログインしてください。' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const cleaned_date = typeof body.cleaned_date === 'string' ? body.cleaned_date.trim() : '';
  const person       = typeof body.person === 'string' ? body.person.trim().slice(0, 50) : '';
  const notes        = typeof body.notes  === 'string' ? body.notes.trim().slice(0, 500) : '';

  if (!cleaned_date || !person)
    return NextResponse.json({ error: '日付と担当者は必須です' }, { status: 400 });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned_date))
    return NextResponse.json({ error: '日付の形式が正しくありません（YYYY-MM-DD）' }, { status: 400 });

  const { data, error } = await supabase
    .from('cleaning_logs')
    .insert({ cleaned_date, person, notes, org_id: orgId })
    .select().single();

  if (error) return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
