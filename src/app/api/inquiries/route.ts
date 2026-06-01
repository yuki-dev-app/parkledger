import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const rows = await sql`SELECT * FROM inquiries ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone = '', email = '', message, notes = '' } = body;

  if (!name || !message)
    return NextResponse.json({ error: '氏名・内容は必須です' }, { status: 400 });

  // 日本時間の現在時刻を文字列で生成
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const createdAt = jst.toISOString().replace('T', ' ').slice(0, 19);

  const [row] = await sql`
    INSERT INTO inquiries (name, phone, email, message, status, notes, created_at)
    VALUES (${name}, ${phone}, ${email}, ${message}, 'new', ${notes}, ${createdAt})
    RETURNING id
  `;
  return NextResponse.json({ id: (row as { id: number }).id });
}
