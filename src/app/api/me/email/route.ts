import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const session = await auth();
  const ownerId = Number(session?.user?.id) || 0;
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body     = await req.json().catch(() => ({}));
  const newEmail = (typeof body.email === 'string' ? body.email.trim().toLowerCase() : '');

  if (!newEmail || !newEmail.includes('@')) {
    return NextResponse.json({ error: '正しいメールアドレスを入力してください' }, { status: 400 });
  }

  // 他のユーザーが同じメールを使っていないか確認
  const existing = await sql`SELECT id FROM users WHERE email = ${newEmail} AND id != ${ownerId}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'このメールアドレスはすでに使われています' }, { status: 400 });
  }

  await sql`UPDATE users SET email = ${newEmail} WHERE id = ${ownerId}`;
  return NextResponse.json({ ok: true });
}
