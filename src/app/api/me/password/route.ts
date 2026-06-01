import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const session = await auth();
  const ownerId = Number(session?.user?.id) || 0;
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body        = await req.json().catch(() => ({}));
  const currentPass = typeof body.current_password === 'string' ? body.current_password : '';
  const newPass     = typeof body.new_password     === 'string' ? body.new_password     : '';

  if (!currentPass || !newPass) {
    return NextResponse.json({ error: '現在のパスワードと新しいパスワードは必須です' }, { status: 400 });
  }
  if (newPass.length < 8) {
    return NextResponse.json({ error: '新しいパスワードは8文字以上にしてください' }, { status: 400 });
  }

  const rows = await sql`SELECT password_hash FROM users WHERE id = ${ownerId}` as { password_hash: string }[];
  if (rows.length === 0) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });

  const ok = await bcrypt.compare(currentPass, rows[0].password_hash);
  if (!ok) {
    return NextResponse.json({ error: '現在のパスワードが違います' }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPass, 12);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${ownerId}`;
  return NextResponse.json({ ok: true });
}
