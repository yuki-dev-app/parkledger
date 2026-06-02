import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const businessName = (typeof body.business_name === 'string' ? body.business_name.trim() : '').slice(0, 100);
  const email        = (typeof body.email         === 'string' ? body.email.trim().toLowerCase() : '');
  const password     = (typeof body.password      === 'string' ? body.password : '');

  if (!businessName || !email || !password) {
    return NextResponse.json({ error: '全ての項目を入力してください' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 });
  }

  // email_confirm: true でメール確認をスキップし、登録直後にログイン可能にする。
  // メール確認アリに切り替える場合: email_confirm を false に変更し、
  // Supabase Dashboard の Authentication > Settings で "Confirm email" を有効にするだけでOK。
  // （確認メールが来るようになり、/auth/callback が処理する）
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { business_name: businessName },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
