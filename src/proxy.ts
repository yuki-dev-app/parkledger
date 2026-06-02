/**
 * Next.js 16 Proxy（旧 Middleware）
 * Supabase SSR セッション更新 + ルート保護
 *
 * 重要: createServerClient と auth.getUser() の間に
 * ロジックを書いてはいけない（Supabase公式の注意事項）
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 認証不要なパス（ページ）
const PUBLIC_PATHS = new Set(['/login', '/register', '/auth/callback', '/auth/confirm']);

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession()でcookieから読むだけ（ネットワーク通信なし）
  // セキュリティの検証はAPIルートのrequireAuth()が担当
  const { data: { session } } = await supabase.auth.getSession();
  const hasSession = !!session;

  const path = request.nextUrl.pathname;

  // 未認証 + 保護されたページ → ログインにリダイレクト
  if (!hasSession && !isPublicPath(path)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みでログイン・登録ページ → ホームにリダイレクト
  if (hasSession && (path === '/login' || path === '/register')) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  // /admin は app_metadata チェック（getUser()で検証 — adminのみ低速パス）
  if (hasSession && path.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.app_metadata?.is_admin) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  // /api/ を除外 → APIルートは自前でrequireAuth()するので二重チェック不要
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
