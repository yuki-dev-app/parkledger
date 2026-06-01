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
    SELECT * FROM inquiries WHERE owner_id = ${ownerId} ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body    = await req.json().catch(() => ({}));
  const name    = (typeof body.name    === 'string' ? body.name.trim()    : '').slice(0, 100);
  const phone   = (typeof body.phone   === 'string' ? body.phone.trim()   : '').slice(0, 20);
  const email   = (typeof body.email   === 'string' ? body.email.trim()   : '').slice(0, 200);
  const message = (typeof body.message === 'string' ? body.message.trim() : '').slice(0, 2000);
  const notes   = (typeof body.notes   === 'string' ? body.notes.trim()   : '').slice(0, 1000);

  if (!name || !message)
    return NextResponse.json({ error: '氏名・内容は必須です' }, { status: 400 });

  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const createdAt = jst.toISOString().replace('T', ' ').slice(0, 19);

  const [row] = await sql`
    INSERT INTO inquiries (name, phone, email, message, status, notes, created_at, owner_id)
    VALUES (${name}, ${phone}, ${email}, ${message}, 'new', ${notes}, ${createdAt}, ${ownerId})
    RETURNING id
  `;
  return NextResponse.json({ id: (row as { id: number }).id });
}
