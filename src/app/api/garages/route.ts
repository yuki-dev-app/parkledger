import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { naturalSort } from '@/lib/sort-utils';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

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
    (garages ?? []).sort((a, b) => naturalSort(a.number, b.number)).map(g => ({
      ...g,
      contractor_name: contractorMap.get(g.id) ?? null,
    })),
    { headers: NO_CACHE_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません。いったんログアウトして再度ログインしてください。' }, { status: 403 });

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
    return NextResponse.json({ error: '保存に失敗しました。時間をおいて再度お試しください' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
