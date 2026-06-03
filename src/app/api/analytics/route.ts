import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const now = new Date();
  // 過去12ヶ月分の年月リスト
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('year_month, amount, status')
    .in('year_month', months);

  const monthly = months.map(ym => {
    const forMonth = (payments ?? []).filter(p => p.year_month === ym);
    const paid   = forMonth.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount as number), 0);
    const unpaid = forMonth.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.amount as number), 0);
    const [y, m] = ym.split('-');
    return { ym, label: `${Number(m)}月`, year: y, paid, unpaid, total: paid + unpaid };
  });

  return NextResponse.json({ months: monthly }, { headers: NO_CACHE_HEADERS });
}
