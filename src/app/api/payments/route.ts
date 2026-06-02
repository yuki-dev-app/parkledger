import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const ym = new URL(req.url).searchParams.get('year_month');
  if (!ym) return NextResponse.json({ error: 'year_month は必須です' }, { status: 400 });

  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, name, garage_id, contract_start, contract_end, garages!inner(number, monthly_fee)')
    .eq('archived_at', '');

  const eligible = (contractors ?? []).filter(c => {
    const start = c.contract_start?.slice(0, 7);
    const end   = c.contract_end?.slice(0, 7) || '';
    return start <= ym && (!end || end >= ym);
  });

  const { data: payments } = await supabase
    .from('payments')
    .select('id, contractor_id, status, paid_date')
    .eq('year_month', ym);

  const payMap = new Map(
    (payments ?? []).map(p => [p.contractor_id, p])
  );

  const rows = eligible.map(c => {
    const p = payMap.get(c.id);
    return {
      contractor_id:   c.id,
      contractor_name: c.name,
      garage_number:   (c.garages as unknown as { number: string }).number,
      amount:          (c.garages as unknown as { monthly_fee: number }).monthly_fee,
      payment_id:      p?.id ?? null,
      status:          p?.status ?? 'unpaid',
      paid_date:       p?.paid_date ?? '',
    };
  });

  rows.sort((a, b) =>
    a.garage_number.length !== b.garage_number.length
      ? a.garage_number.length - b.garage_number.length
      : a.garage_number.localeCompare(b.garage_number, 'ja-JP', { numeric: true })
  );

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '組織が見つかりません' }, { status: 403 });

  const body                   = await req.json();
  const { contractor_id, year_month, status } = body;

  if (!contractor_id || !year_month || !status)
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });

  // 金額はサーバーで取得（改ざん防止）
  const { data: contractor } = await supabase
    .from('contractors')
    .select('garages!inner(monthly_fee)')
    .eq('id', contractor_id)
    .single();

  if (!contractor) return NextResponse.json({ error: '契約者が見つかりません' }, { status: 404 });
  const amount   = (contractor.garages as unknown as { monthly_fee: number }).monthly_fee;
  const paidDate = status === 'paid' ? new Date().toISOString().slice(0, 10) : '';

  const { error } = await supabase
    .from('payments')
    .upsert(
      { contractor_id, year_month, amount, status, paid_date: paidDate, org_id: orgId },
      { onConflict: 'contractor_id,year_month' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
