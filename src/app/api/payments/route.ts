import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

export async function GET(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ym = searchParams.get('year_month');
  if (!ym) return NextResponse.json({ error: 'year_month は必須です' }, { status: 400 });

  const rows = await sql`
    SELECT
      c.id       AS contractor_id,
      c.name     AS contractor_name,
      g.number   AS garage_number,
      g.monthly_fee AS amount,
      p.id       AS payment_id,
      COALESCE(p.status, 'unpaid') AS status,
      COALESCE(p.paid_date, '')    AS paid_date
    FROM contractors c
    JOIN  garages g  ON g.id = c.garage_id
    LEFT JOIN payments p ON p.contractor_id = c.id AND p.year_month = ${ym}
    WHERE c.archived_at = ''
      AND c.owner_id = ${ownerId}
      AND LEFT(c.contract_start, 7) <= ${ym}
      AND (c.contract_end = '' OR LEFT(c.contract_end, 7) >= ${ym})
    ORDER BY LENGTH(g.number), g.number
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json();
  const { contractor_id, year_month, status } = body;

  if (!contractor_id || !year_month || !status)
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });

  // 自分のオーナーの契約者かチェックしつつ金額を取得（改ざん防止）
  const garageRows = await sql`
    SELECT g.monthly_fee FROM contractors c
    JOIN garages g ON g.id = c.garage_id
    WHERE c.id = ${contractor_id} AND c.owner_id = ${ownerId}
  `;
  if (garageRows.length === 0)
    return NextResponse.json({ error: '契約者が見つかりません' }, { status: 404 });

  const amount   = (garageRows[0] as { monthly_fee: number }).monthly_fee;
  const paidDate = status === 'paid' ? new Date().toISOString().slice(0, 10) : '';

  await sql`
    INSERT INTO payments (contractor_id, year_month, amount, status, paid_date, owner_id)
    VALUES (${contractor_id}, ${year_month}, ${amount}, ${status}, ${paidDate}, ${ownerId})
    ON CONFLICT (contractor_id, year_month)
    DO UPDATE SET status = EXCLUDED.status, paid_date = EXCLUDED.paid_date, amount = EXCLUDED.amount
  `;

  return NextResponse.json({ ok: true });
}
