import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const garages = await sql`
    SELECT g.*, c.name AS contractor_name
    FROM garages g
    LEFT JOIN contractors c ON c.garage_id = g.id
    ORDER BY LENGTH(g.number), g.number
  `;
  return NextResponse.json(garages);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { number, status = 'vacant', monthly_fee = 0, notes = '' } = body;
  if (!number) return NextResponse.json({ error: '区画番号は必須です' }, { status: 400 });

  const existing = await sql`SELECT id FROM garages WHERE number = ${number}`;
  if (existing.length > 0)
    return NextResponse.json({ error: `区画番号 ${number} はすでに存在します` }, { status: 400 });

  const [row] = await sql`
    INSERT INTO garages (number, status, monthly_fee, notes)
    VALUES (${number}, ${status}, ${monthly_fee}, ${notes})
    RETURNING id
  `;
  return NextResponse.json({ id: row.id });
}
