/**
 * サーバーサイドログインエンドポイント
 *
 * メールアドレスをクライアントに一切返さずにログイン処理を完結させる。
 * login_id → email の変換をサーバー内部でのみ行い、
 * セッションCookieをセットしてOK/エラーのみ返す。
 *
 * これにより resolve-login-id がメールを返す設計上の漏洩を解消する。
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // IPベースのレート制限: 10分間に10回まで
  const ip = getClientIp(req);
  const { allowed: ipAllowed } = await checkRateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
  if (!ipAllowed) {
    return NextResponse.json({ error: 'しばらく時間をおいてから再試行してください' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { identifier, password } = body;

  if (!identifier || !password || typeof identifier !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'IDとパスワードを入力してください' }, { status: 400 });
  }

  // ログインIDベースのレート制限: 15分間に5回まで（分散辞書攻撃対策）
  const normalizedId = identifier.trim().toLowerCase();
  const { allowed: idAllowed } = await checkRateLimit(`login-id:${normalizedId}`, 5, 15 * 60 * 1000);
  if (!idAllowed) {
    return NextResponse.json({ error: 'しばらく時間をおいてから再試行してください' }, { status: 429 });
  }

  let email = normalizedId;

  // ログインIDの場合はサーバー内部でメールに変換（クライアントに返さない）
  if (!email.includes('@')) {
    const { data: member } = await supabaseAdmin
      .from('org_members')
      .select('user_id')
      .eq('login_id', email)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'IDまたはパスワードが正しくありません' }, { status: 401 });
    }

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
    if (userErr || !user?.email) {
      return NextResponse.json({ error: 'IDまたはパスワードが正しくありません' }, { status: 401 });
    }
    email = user.email;
  }

  // サーバーサイドで signInWithPassword（メールをクライアントに返さない）
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()              { return cookieStore.getAll(); },
        setAll(cookiesToSet)  {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    if (signInError.message.toLowerCase().includes('email not confirmed')) {
      return NextResponse.json({ error: 'email_not_confirmed' }, { status: 401 });
    }
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
