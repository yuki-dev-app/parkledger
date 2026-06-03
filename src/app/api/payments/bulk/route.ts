import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません' }, { status: 403 });

  const { year_month, contractor_ids } = await req.json().catch(() => ({}));
  if (!year_month || !Array.isArray(contractor_ids) || contractor_ids.length === 0)
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);

  // 対象契約者の月額を取得（金額はサーバーで取得・改ざん防止）
  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, garages!inner(monthly_fee)')
    .in('id', contractor_ids)
    .eq('archived_at', '');

  if (!contractors || contractors.length === 0)
    return NextResponse.json({ error: '対象の契約者が見つかりません' }, { status: 404 });

  const records = contractors.map(c => ({
    contractor_id: c.id,
    year_month,
    amount: (c.garages as unknown as { monthly_fee: number }).monthly_fee,
    status: 'paid',
    paid_date: today,
    org_id: orgId,
  }));

  const { error } = await supabase
    .from('payments')
    .upsert(records, { onConflict: 'contractor_id,year_month' });

  if (error) return NextResponse.json({ error: '一括更新に失敗しました' }, { status: 500 });

  return NextResponse.json({ ok: true, count: records.length });
}
