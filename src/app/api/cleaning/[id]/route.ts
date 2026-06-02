import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const body   = await req.json().catch(() => ({}));
  const cleaned_date = typeof body.cleaned_date === 'string' ? body.cleaned_date : '';
  const person       = (typeof body.person === 'string' ? body.person.trim() : '').slice(0, 100);
  const notes        = (typeof body.notes  === 'string' ? body.notes.trim()  : '').slice(0, 1000);

  if (!DATE_RE.test(cleaned_date) || !person) {
    return NextResponse.json({ error: '日付と担当者は必須です' }, { status: 400 });
  }

  const { error } = await supabase
    .from('cleaning_logs')
    .update({ cleaned_date, person, notes })
    .eq('id', Number(id));

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase.from('cleaning_logs').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
