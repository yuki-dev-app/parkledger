/**
 * パスワードリセットメール送信エンドポイント
 *
 * クライアントから直接 Supabase を呼ぶと Upstash レート制限が適用されないため、
 * このサーバーサイドルートを経由させる。
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  // レート制限: 同一IPから15分間に3回まで
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`reset-pw:${ip}`, 3, 15 * 60 * 1000);
  if (!allowed) {
    // ユーザー列挙防止のため、超過時も同じ200を返す
    return NextResponse.json({ ok: true });
  }

  const body  = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: '正しいメールアドレスを入力してください' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const redirectTo = `${req.nextUrl.origin}/auth/callback`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    console.error('[reset-password] error:', error.message);
  }

  // ユーザー列挙防止: 成功・失敗・未登録メールすべて同じ200レスポンス
  return NextResponse.json({ ok: true });
}
