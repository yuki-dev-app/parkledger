import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const garages = await sql`
    SELECT g.*, c.name AS contractor_name
    FROM garages g
    LEFT JOIN contractors c ON c.garage_id = g.id AND c.archived_at = ''
    WHERE g.owner_id = ${ownerId}
    ORDER BY LENGTH(g.number), g.number
  `;
  return NextResponse.json(garages);
}

export async function POST(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const number      = (typeof body.number === 'string' ? body.number.trim() : '').slice(0, 20);
  const status      = ['vacant', 'occupied', 'maintenance'].includes(body.status) ? body.status : 'vacant';
  const monthly_fee = Math.max(0, Math.min(9_999_999, Number(body.monthly_fee) || 0));
  const notes       = (typeof body.notes === 'string' ? body.notes.trim() : '').slice(0, 500);

  if (!number) return NextResponse.json({ error: '区画番号は必須です' }, { status: 400 });

  const existing = await sql`SELECT id FROM garages WHERE number = ${number} AND owner_id = ${ownerId}`;
  if (existing.length > 0)
    return NextResponse.json({ error: `区画番号 ${number} はすでに存在します` }, { status: 400 });

  const [row] = await sql`
    INSERT INTO garages (number, status, monthly_fee, notes, owner_id)
    VALUES (${number}, ${status}, ${monthly_fee}, ${notes}, ${ownerId})
    RETURNING id
  `;
  return NextResponse.json({ id: (row as { id: number }).id });
}
