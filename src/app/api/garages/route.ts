import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

// 自然順ソート（1,2,3...10,11 の順）
function naturalSort<T extends { number: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) =>
    a.number.length !== b.number.length
      ? a.number.length - b.number.length
      : a.number.localeCompare(b.number, 'ja-JP', { numeric: true })
  );
}

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  // RLS が自動的に自分のorgのデータだけ返す
  const [{ data: garages }, { data: activeContractors }] = await Promise.all([
    supabase.from('garages').select('*'),
    supabase.from('contractors').select('id, name, garage_id').eq('archived_at', ''),
  ]);

  const contractorMap = new Map(
    (activeContractors ?? []).map(c => [c.garage_id as number, c.name as string])
  );

  return NextResponse.json(
    naturalSort(garages ?? []).map(g => ({
      ...g,
      contractor_name: contractorMap.get(g.id) ?? null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '組織が見つかりません' }, { status: 403 });

  const body        = await req.json().catch(() => ({}));
  const number      = (typeof body.number === 'string' ? body.number.trim() : '').slice(0, 20);
  const status      = ['vacant', 'occupied', 'maintenance'].includes(body.status) ? body.status : 'vacant';
  const monthly_fee = Math.max(0, Math.min(9_999_999, Number(body.monthly_fee) || 0));
  const notes       = (typeof body.notes === 'string' ? body.notes.trim() : '').slice(0, 500);

  if (!number) return NextResponse.json({ error: '区画番号は必須です' }, { status: 400 });

  const { data, error } = await supabase
    .from('garages')
    .insert({ number, status, monthly_fee, notes, org_id: orgId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: `区画番号 ${number} はすでに存在します` }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
