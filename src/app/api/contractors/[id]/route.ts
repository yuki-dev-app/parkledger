import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/supabase/server';

const t = (v: unknown, max: number) => (typeof v === 'string' ? v.trim() : '').slice(0, max);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const perm = await requireOwner();
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const body   = await req.json();

  // 現在の契約者情報を取得（garage_id 変更の判定に使う）
  const { data: current, error: fetchErr } = await supabase
    .from('contractors')
    .select('garage_id')
    .eq('id', Number(id))
    .single();

  if (fetchErr || !current) return NextResponse.json({ error: '契約者が見つかりません' }, { status: 404 });

  const newGarageId   = body.garage_id ? Number(body.garage_id) : current.garage_id;
  const garageChanged = newGarageId !== current.garage_id;

  // 区画が変わる場合は移動先が空きかチェック
  if (garageChanged) {
    const { data: newGarage } = await supabase
      .from('garages')
      .select('status, number')
      .eq('id', newGarageId)
      .single();

    if (!newGarage) {
      return NextResponse.json({ error: '移動先の区画が見つかりません' }, { status: 404 });
    }
    if (newGarage.status !== 'vacant') {
      return NextResponse.json(
        { error: `${newGarage.number}番区画はすでに使用中です` },
        { status: 409 }
      );
    }

    // 旧区画 → 空き、新区画 → 使用中
    await Promise.all([
      supabase.from('garages').update({ status: 'vacant'   }).eq('id', current.garage_id),
      supabase.from('garages').update({ status: 'occupied' }).eq('id', newGarageId),
    ]);
  }

  const updates: Record<string, unknown> = {
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
  if (garageChanged) updates.garage_id = newGarageId;
  // 車の写真URL配列（空配列で全削除、未指定は変更しない）
  if ('car_photo_urls' in body) {
    updates.car_photo_urls = Array.isArray(body.car_photo_urls)
      ? body.car_photo_urls.map((u: unknown) => t(u, 500)).filter(Boolean)
      : null;
  }

  const { data, error } = await supabase
    .from('contractors')
    .update(updates)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    // car_photo_urls カラムが未作成の場合は写真なしで再試行
    const isColumnMissing = error.code === '42703' || error.message?.includes('car_photo_urls');
    if ('car_photo_urls' in updates && isColumnMissing) {
      const { car_photo_urls: _, ...updatesWithoutPhotos } = updates;
      const { error: error2 } = await supabase
        .from('contractors')
        .update(updatesWithoutPhotos)
        .eq('id', Number(id));
      if (error2) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
      return NextResponse.json({ ok: true, garage_changed: garageChanged });
    }
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }

  if (!data) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  return NextResponse.json({ ok: true, garage_changed: garageChanged });
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

  const { error } = await supabase.from('contractors').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });

  await Promise.all([
    supabase.from('payments').delete().eq('contractor_id', Number(id)),
    supabase.from('reminder_logs').delete().eq('contractor_id', Number(id)),
  ]);

  await supabase.from('garages').update({ status: 'vacant' }).eq('id', contractor.garage_id);

  return NextResponse.json({ ok: true });
}
