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
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '組織が見つかりません' }, { status: 403 });

  const body = await req.json();
  const { cleaned_date, person, notes = '' } = body;
  if (!cleaned_date || !person)
    return NextResponse.json({ error: '日付と担当者は必須です' }, { status: 400 });

  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const createdAt = jst.toISOString().replace('T', ' ').slice(0, 19);

  const { data, error } = await supabase
    .from('cleaning_logs')
    .insert({ cleaned_date, person, notes, created_at: createdAt, org_id: orgId })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
