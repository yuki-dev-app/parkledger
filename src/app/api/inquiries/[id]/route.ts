import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

const VALID_STATUSES = ['in_progress', 'resolved'] as const;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id }            = await params;
  const { status, notes } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
  }

  const { error } = await supabase
    .from('inquiries')
    .update({ status, notes: notes ?? '' })
    .eq('id', Number(id));

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase.from('inquiries').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
