import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const body   = await req.json();
  let { status } = body;
  const { monthly_fee, notes } = body;

  // 契約者がいれば強制的に occupied（RLS が自分のorgのみを見る）
  const { data: contractor } = await supabase
    .from('contractors')
    .select('id')
    .eq('garage_id', Number(id))
    .eq('archived_at', '')
    .maybeSingle();

  if (contractor) {
    status = 'occupied';
  } else if (status === 'occupied') {
    return NextResponse.json({ error: '契約者がいないため使用中にできません' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('garages')
    .update({ status, monthly_fee: Number(monthly_fee) || 0, notes: notes ?? '' })
    .eq('id', Number(id))
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: '区画が見つかりません' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id')
    .eq('garage_id', Number(id))
    .eq('archived_at', '')
    .maybeSingle();

  if (contractor) {
    return NextResponse.json({ error: '契約者がいる区画は削除できません。先に契約者を削除してください。' }, { status: 400 });
  }

  const { error } = await supabase.from('garages').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
