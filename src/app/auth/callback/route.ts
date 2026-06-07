/**
 * Supabase Auth コールバック
 * メール確認・パスワードリセットのリンクはここに飛んでくる
 *
 * 2種類のフローに対応:
 *   - token_hash フロー（旧形式）: ?token_hash=xxx&type=email|recovery
 *   - PKCE フロー（新形式）: ?code=xxx
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type      = searchParams.get('type') as 'magiclink' | 'recovery' | 'email' | null;
  const code      = searchParams.get('code');
  // オープンリダイレクト対策: 相対パス（/始まり）のみ許可
  const rawNext = searchParams.get('next') ?? '/';
  const next    = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // PKCE フロー（Supabase 新形式）
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // token_hash フロー（旧形式）
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      // パスワードリセットの場合は確認ページへ
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password/confirm', request.url));
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback', request.url));
}
