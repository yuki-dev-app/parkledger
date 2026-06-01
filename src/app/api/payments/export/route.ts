import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ym = searchParams.get('year_month');
  if (!ym) return NextResponse.json({ error: 'year_month は必須です' }, { status: 400 });

  const rows = await sql`
    SELECT
      g.number   AS garage_number,
      c.name     AS contractor_name,
      g.monthly_fee AS amount,
      COALESCE(p.status, 'unpaid') AS status,
      COALESCE(p.paid_date, '')    AS paid_date
    FROM contractors c
    JOIN  garages g  ON g.id = c.garage_id
    LEFT JOIN payments p ON p.contractor_id = c.id AND p.year_month = ${ym}
    WHERE c.archived_at = ''
      AND LEFT(c.contract_start, 7) <= ${ym}
      AND (c.contract_end = '' OR LEFT(c.contract_end, 7) >= ${ym})
    ORDER BY LENGTH(g.number), g.number
  ` as { garage_number: string; contractor_name: string; amount: number; status: string; paid_date: string }[];

  const statusJa = (s: string) => s === 'paid' ? '入金済' : '未入金';
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = ['区画番号', '契約者名', '金額', '入金状況', '入金日'];
  const lines = [header.join(',')];
  let total = 0;
  for (const r of rows) {
    if (r.status === 'paid') total += r.amount;
    lines.push([esc(r.garage_number), esc(r.contractor_name), esc(r.amount), esc(statusJa(r.status)), esc(r.paid_date)].join(','));
  }
  lines.push('');
  lines.push(`入金済合計,,${total},,`);

  // UTF-8 BOM付き（Excelで文字化けしない）
  const csv = '﻿' + lines.join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="parkledger_${ym}.csv"`,
    },
  });
}
