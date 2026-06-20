import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { naturalSort } from '@/lib/sort-utils';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

const MAX = { name:100, phone:20, email:200, address:300, vehicle_type:100, vehicle_number:50, vehicle_chassis:100, emergency_contact:100, notes:1000 };
const t = (v: unknown, max: number) => (typeof v === 'string' ? v.trim() : '').slice(0, max);

export async function GET(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません' }, { status: 403 });

  const archived = new URL(req.url).searchParams.get('archived') === '1';

  const query = supabase
    .from('contractors')
    .select('*, garages!inner(number, monthly_fee)')
    .eq('org_id', orgId); // RLS単独依存を避けるための明示フィルタ

  const { data, error } = archived
    ? await query.neq('archived_at', '').order('archived_at', { ascending: false })
    : await query.eq('archived_at', '');

  if (error) return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });

  const rows = (data ?? []).map(c => ({
    ...c,
    garage_number: (c.garages as unknown as { number: string }).number,
    monthly_fee:   (c.garages as unknown as { monthly_fee: number }).monthly_fee,
    garages:       undefined,
  }));

  if (!archived) rows.sort((a, b) => naturalSort(a.garage_number, b.garage_number));

  return NextResponse.json(rows, { headers: NO_CACHE_HEADERS });
}

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません。いったんログアウトして再度ログインしてください。' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const garage_id         = Number(body.garage_id) || 0;
  const name              = t(body.name,              MAX.name);
  const phone             = t(body.phone,             MAX.phone);
  const email             = t(body.email,             MAX.email);
  const address           = t(body.address,           MAX.address);
  const vehicle_type      = t(body.vehicle_type,      MAX.vehicle_type);
  const vehicle_number    = t(body.vehicle_number,    MAX.vehicle_number);
  const vehicle_chassis   = t(body.vehicle_chassis,   MAX.vehicle_chassis);
  const emergency_contact = t(body.emergency_contact, MAX.emergency_contact);
  const contract_start    = t(body.contract_start,    10);
  const contract_end      = t(body.contract_end,      10);
  const notes             = t(body.notes,             MAX.notes);
  const car_photo_urls    = Array.isArray(body.car_photo_urls)
    ? body.car_photo_urls.map((u: unknown) => t(u, 500)).filter(Boolean)
    : [];

  if (!garage_id || !name || !contract_start)
    return NextResponse.json({ error: '区画・氏名・契約開始日は必須です' }, { status: 400 });

  const { data: contractor, error: cErr } = await supabase
    .from('contractors')
    .insert({ garage_id, name, phone, email, address, vehicle_type, vehicle_number, vehicle_chassis, emergency_contact, contract_start, contract_end, notes, org_id: orgId, car_photo_urls })
    .select()
    .single();

  if (cErr) return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });

  const { error: garageErr } = await supabase
    .from('garages')
    .update({ status: 'occupied' })
    .eq('id', garage_id);

  if (garageErr) {
    // Bug11修正: 補償削除のエラーを確認してログに記録
    const { error: rollbackErr } = await supabase.from('contractors').delete().eq('id', contractor.id);
    if (rollbackErr) {
      console.error('[contractors POST] ロールバック失敗 - 手動確認が必要:', rollbackErr.message);
    }
    return NextResponse.json({ error: '区画ステータスの更新に失敗しました。再度お試しください。' }, { status: 500 });
  }

  return NextResponse.json({ id: contractor.id });
}
