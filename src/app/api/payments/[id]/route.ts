import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const { status, paid_date, amount, notes } = await req.json();

  const { data, error } = await supabase
    .from('payments')
    .update({ status, paid_date: paid_date ?? '', amount: Number(amount) || 0, notes: notes ?? '' })
    .eq('id', Number(id))
    .select().single();

  if (error || !data) return NextResponse.json({ error: '見つかりません' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  await supabase.from('payments').delete().eq('id', Number(id));
  return NextResponse.json({ ok: true });
}
