import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

// ユーザー一覧取得
export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const users = await sql`
    SELECT id, email, login_id, created_at, is_active FROM users ORDER BY id
  ` as { id: number; email: string; login_id: string | null; created_at: string; is_active: boolean }[];

  return NextResponse.json(users);
}

// 新しいユーザーを追加
export async function POST(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email    = (typeof body.email    === 'string' ? body.email.trim().toLowerCase()    : '');
  const password = (typeof body.password === 'string' ? body.password : '');

  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 });
  }

  // メール重複チェック
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  const [user] = await sql`
    INSERT INTO users (email, password_hash) VALUES (${email}, ${hash}) RETURNING id, email
  ` as { id: number; email: string }[];

  return NextResponse.json({ id: user.id, email: user.email });
}
