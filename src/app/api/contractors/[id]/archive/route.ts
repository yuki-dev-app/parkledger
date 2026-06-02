import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id }          = await params;
  const { reason = '' } = await req.json().catch(() => ({}));

  const { data: contractor } = await supabase
    .from('contractors')
    .select('garage_id')
    .eq('id', Number(id))
    .eq('archived_at', '')
    .single();

  if (!contractor) return NextResponse.json({ error: '契約者が見つかりません' }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);

  const { error: archiveError } = await supabase
    .from('contractors')
    .update({ archived_at: today, archive_reason: reason })
    .eq('id', Number(id));

  if (archiveError) return NextResponse.json({ error: '解約処理に失敗しました' }, { status: 500 });

  await supabase.from('garages').update({ status: 'vacant' }).eq('id', contractor.garage_id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  const { data: contractor } = await supabase
    .from('contractors')
    .select('garage_id')
    .eq('id', Number(id))
    .single();

  if (!contractor) return NextResponse.json({ error: '見つかりません' }, { status: 404 });

  await supabase.from('contractors').update({ archived_at: '', archive_reason: '' }).eq('id', Number(id));
  await supabase.from('garages').update({ status: 'occupied' }).eq('id', contractor.garage_id);

  return NextResponse.json({ ok: true });
}
