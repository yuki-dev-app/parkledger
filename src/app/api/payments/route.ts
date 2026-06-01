import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// 指定月の全契約者の入金状況を返す（入金記録がなくても未入金として表示）
export async function GET(req: NextRequest) {
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
      AND LEFT(c.contract_start, 7) <= ${ym}
      AND (c.contract_end = '' OR LEFT(c.contract_end, 7) >= ${ym})
    ORDER BY LENGTH(g.number), g.number
  `;
  return NextResponse.json(rows);
}

// ワンボタンで入金状態を切り替え（記録がなければ作成、あれば更新）
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { contractor_id, year_month, status } = body;

  if (!contractor_id || !year_month || !status)
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });

  // 金額はサーバー側で区画料金から取得（改ざん防止）
  const garageRows = await sql`
    SELECT g.monthly_fee FROM contractors c
    JOIN garages g ON g.id = c.garage_id
    WHERE c.id = ${contractor_id}
  `;
  if (garageRows.length === 0)
    return NextResponse.json({ error: '契約者が見つかりません' }, { status: 404 });

  const amount = (garageRows[0] as { monthly_fee: number }).monthly_fee;
  const paidDate = status === 'paid' ? new Date().toISOString().slice(0, 10) : '';

  await sql`
    INSERT INTO payments (contractor_id, year_month, amount, status, paid_date)
    VALUES (${contractor_id}, ${year_month}, ${amount}, ${status}, ${paidDate})
    ON CONFLICT (contractor_id, year_month)
    DO UPDATE SET status = EXCLUDED.status, paid_date = EXCLUDED.paid_date, amount = EXCLUDED.amount
  `;

  return NextResponse.json({ ok: true });
}
