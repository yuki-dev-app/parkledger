/**
 * Next.js 16 Proxy（旧 Middleware）
 * Supabase SSR セッション更新 + ルート保護
 *
 * 重要: createServerClient と auth.getUser() の間に
 * ロジックを書いてはいけない（Supabase公式の注意事項）
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 認証不要なパス
const PUBLIC_PATHS = new Set(['/login', '/register', '/auth/callback', '/auth/confirm']);

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  if (path.startsWith('/api/auth')) return true;
  if (path === '/api/register') return true;
  if (path.startsWith('/_next')) return true;
  if (path === '/favicon.ico') return true;
  return false;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // リクエストのcookieを更新
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // レスポンスのcookieを更新（セッション維持に必須）
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションを更新（必ずこの位置で呼ぶ）
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 未認証 + 保護されたパス → ログインにリダイレクト
  if (!user && !isPublicPath(path)) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みでログインページ → ホームにリダイレクト
  if (user && path === '/login') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  // /admin は is_admin ユーザーのみ
  if (user && path.startsWith('/admin')) {
    const isAdmin = user.user_metadata?.is_admin === true;
    if (!isAdmin) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
