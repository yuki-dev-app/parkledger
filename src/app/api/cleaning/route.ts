import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const rows = await sql`
    SELECT * FROM cleaning_logs
    ORDER BY cleaned_date DESC, id DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cleaned_date, person, notes = '' } = body;

  if (!cleaned_date || !person)
    return NextResponse.json({ error: '日付と担当者は必須です' }, { status: 400 });

  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const createdAt = jst.toISOString().replace('T', ' ').slice(0, 19);

  const [row] = await sql`
    INSERT INTO cleaning_logs (cleaned_date, person, notes, created_at)
    VALUES (${cleaned_date}, ${person}, ${notes}, ${createdAt})
    RETURNING id
  `;
  return NextResponse.json({ id: (row as { id: number }).id });
}
