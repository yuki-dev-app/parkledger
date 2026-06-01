import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const session = await auth();
  const ownerId = Number(session?.user?.id) || 0;
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body    = await req.json().catch(() => ({}));
  const loginId = typeof body.login_id === 'string' ? body.login_id.trim() : '';

  // 空文字の場合はIDを削除（NULLに戻す）
  if (!loginId) {
    await sql`UPDATE users SET login_id = NULL WHERE id = ${ownerId}`;
    return NextResponse.json({ ok: true });
  }

  // 使用可能な文字のみ許可（英数字・ハイフン・アンダースコア）
  if (!/^[a-zA-Z0-9_\-]{3,30}$/.test(loginId)) {
    return NextResponse.json({
      error: 'IDは3〜30文字の英数字（a-z、0-9）、ハイフン(-)、アンダースコア(_)のみ使えます',
    }, { status: 400 });
  }

  // 他のユーザーが同じIDを使っていないか確認
  const existing = await sql`SELECT id FROM users WHERE login_id = ${loginId} AND id != ${ownerId}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'このIDはすでに使われています' }, { status: 400 });
  }

  // メールアドレスと同じIDは禁止（混同防止）
  const emailCheck = await sql`SELECT id FROM users WHERE email = ${loginId}`;
  if (emailCheck.length > 0) {
    return NextResponse.json({ error: 'メールアドレスと同じIDは使えません' }, { status: 400 });
  }

  await sql`UPDATE users SET login_id = ${loginId} WHERE id = ${ownerId}`;
  return NextResponse.json({ ok: true });
}
