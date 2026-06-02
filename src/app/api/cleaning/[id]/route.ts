import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id }                       = await params;
  const { cleaned_date, person, notes } = await req.json();

  await supabase.from('cleaning_logs').update({ cleaned_date, person, notes: notes ?? '' }).eq('id', Number(id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  await supabase.from('cleaning_logs').delete().eq('id', Number(id));
  return NextResponse.json({ ok: true });
}
