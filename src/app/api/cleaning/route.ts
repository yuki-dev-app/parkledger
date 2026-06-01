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

  const rows = await sql`
    SELECT * FROM cleaning_logs
    WHERE owner_id = ${ownerId}
    ORDER BY cleaned_date DESC, id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json();
  const { cleaned_date, person, notes = '' } = body;

  if (!cleaned_date || !person)
    return NextResponse.json({ error: '日付と担当者は必須です' }, { status: 400 });

  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const createdAt = jst.toISOString().replace('T', ' ').slice(0, 19);

  const [row] = await sql`
    INSERT INTO cleaning_logs (cleaned_date, person, notes, created_at, owner_id)
    VALUES (${cleaned_date}, ${person}, ${notes}, ${createdAt}, ${ownerId})
    RETURNING id
  `;
  return NextResponse.json({ id: (row as { id: number }).id });
}
