import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

// ─── セットアップAPIは「ユーザーが0人のとき」だけ動作 ───
// 一度アカウントが作られると、このエンドポイントは何もしない。

export async function POST(req: NextRequest) {
  // ① すでにユーザーが存在すればエラー（セキュリティ上の重要チェック）
  const existing = await sql`SELECT COUNT(*) AS n FROM users`;
  if (Number((existing[0] as { n: string }).n) > 0) {
    return NextResponse.json({ error: 'すでにアカウントが作成されています' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email    = (typeof body.email    === 'string' ? body.email.trim().toLowerCase()    : '');
  const password = (typeof body.password === 'string' ? body.password : '');

  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 });
  }

  // ② パスワードをハッシュ化して保存（平文は保存しない）
  const hash = await bcrypt.hash(password, 12);
  const [user] = await sql`
    INSERT INTO users (email, password_hash) VALUES (${email}, ${hash}) RETURNING id
  ` as { id: number }[];

  const ownerId = user.id;

  // ③ 既存データを全てこのオーナーに紐付け
  await sql`UPDATE garages       SET owner_id = ${ownerId} WHERE owner_id IS NULL`;
  await sql`UPDATE contractors   SET owner_id = ${ownerId} WHERE owner_id IS NULL`;
  await sql`UPDATE payments      SET owner_id = ${ownerId} WHERE owner_id IS NULL`;
  await sql`UPDATE inquiries     SET owner_id = ${ownerId} WHERE owner_id IS NULL`;
  await sql`UPDATE settings      SET owner_id = ${ownerId} WHERE owner_id IS NULL`;
  await sql`UPDATE cleaning_logs SET owner_id = ${ownerId} WHERE owner_id IS NULL`;

  // ④ owner_id を NOT NULL に変更（以降は必須）
  await sql`ALTER TABLE garages       ALTER COLUMN owner_id SET NOT NULL`;
  await sql`ALTER TABLE contractors   ALTER COLUMN owner_id SET NOT NULL`;
  await sql`ALTER TABLE payments      ALTER COLUMN owner_id SET NOT NULL`;
  await sql`ALTER TABLE inquiries     ALTER COLUMN owner_id SET NOT NULL`;
  await sql`ALTER TABLE settings      ALTER COLUMN owner_id SET NOT NULL`;
  await sql`ALTER TABLE cleaning_logs ALTER COLUMN owner_id SET NOT NULL`;

  // ⑤ settingsテーブルのPRIMARY KEYをオーナー別に変更
  await sql`ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey`;
  await sql`ALTER TABLE settings ADD CONSTRAINT settings_pkey PRIMARY KEY (key, owner_id)`;

  // ⑥ 区画番号のUNIQUE制約を「同じオーナー内で一意」に変更
  await sql`ALTER TABLE garages DROP CONSTRAINT IF EXISTS garages_number_owner_unique`;
  await sql`ALTER TABLE garages ADD CONSTRAINT garages_number_owner_unique UNIQUE (number, owner_id)`;

  return NextResponse.json({ ok: true });
}
