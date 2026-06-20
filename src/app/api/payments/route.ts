import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/supabase/server';
import { naturalSort } from '@/lib/sort-utils';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const ownerCheck = await requireOwner();
  if (!ownerCheck.ok) return ownerCheck.response;

  const ym = new URL(req.url).searchParams.get('year_month');
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return NextResponse.json({ error: 'year_month の形式が正しくありません' }, { status: 400 });

  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, name, phone, email, garage_id, contract_start, contract_end, garages!inner(number, monthly_fee)')
    .eq('archived_at', '');

  const eligible = (contractors ?? []).filter(c => {
    const start = c.contract_start?.slice(0, 7);
    const end   = c.contract_end?.slice(0, 7) || '';
    // Bug10修正: contract_start が null の場合を明示的に除外
    if (!start) return false;
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
      phone:           c.phone ?? '',
      email:           c.email ?? '',
      garage_number:   (c.garages as unknown as { number: string }).number,
      amount:          (c.garages as unknown as { monthly_fee: number }).monthly_fee,
      payment_id:      p?.id ?? null,
      status:          p?.status ?? 'unpaid',
      paid_date:       p?.paid_date ?? '',
    };
  });

  rows.sort((a, b) => naturalSort(a.garage_number, b.garage_number));

  return NextResponse.json(rows, { headers: NO_CACHE_HEADERS });
}

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません。いったんログアウトして再度ログインしてください。' }, { status: 403 });

  const body = await req.json();
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
  const amount = (contractor.garages as unknown as { monthly_fee: number }).monthly_fee;

  // 入金日: リクエストで指定された日付 or 今日（YYYY-MM-DD 形式のみ受け付ける）
  const rawDate  = typeof body.paid_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.paid_date)
    ? body.paid_date
    : new Date().toISOString().slice(0, 10);
  const paidDate = status === 'paid' ? rawDate : '';

  const { error } = await supabase
    .from('payments')
    .upsert(
      { contractor_id, year_month, amount, status, paid_date: paidDate, org_id: orgId },
      { onConflict: 'contractor_id,year_month' }
    );

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
