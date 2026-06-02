import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/supabase/server';

const t = (v: unknown, max: number) => (typeof v === 'string' ? v.trim() : '').slice(0, max);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const body   = await req.json();

  const updates = {
    name:              t(body.name, 100),
    phone:             t(body.phone, 20),
    email:             t(body.email, 200),
    address:           t(body.address, 300),
    vehicle_type:      t(body.vehicle_type, 100),
    vehicle_number:    t(body.vehicle_number, 50),
    vehicle_chassis:   t(body.vehicle_chassis, 100),
    emergency_contact: t(body.emergency_contact, 100),
    contract_start:    t(body.contract_start, 10),
    contract_end:      t(body.contract_end, 10),
    notes:             t(body.notes, 1000),
  };

  const { data, error } = await supabase
    .from('contractors')
    .update(updates)
    .eq('id', Number(id))
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: '契約者が見つかりません' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const perm = await requireOwner();
  if (!perm.ok) return perm.response;

  const { id } = await params;

  const { data: contractor } = await supabase
    .from('contractors')
    .select('garage_id')
    .eq('id', Number(id))
    .single();

  if (!contractor) return NextResponse.json({ error: '見つかりません' }, { status: 404 });

  // 契約者削除（失敗したら中断）→ 関連データ削除 → 区画を空きに
  const { error } = await supabase.from('contractors').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });

  // 関連レコードを並行削除（エラーは無視 — 親レコード削除済みのため孤立しても問題ない）
  await Promise.all([
    supabase.from('payments').delete().eq('contractor_id', Number(id)),
    supabase.from('reminder_logs').delete().eq('contractor_id', Number(id)),
  ]);

  await supabase.from('garages').update({ status: 'vacant' }).eq('id', contractor.garage_id);

  return NextResponse.json({ ok: true });
}
