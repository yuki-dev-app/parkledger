/**
 * Next.js 16 Proxy（旧 Middleware）
 * ページルートの保護 + セッション cookie の更新
 *
 * ─── セキュリティ設計の注意事項 ────────────────────────────────
 *
 * ここでは auth.getSession() を使う（cookie読み取りのみ・ネットワーク通信なし）。
 * これはページ遷移を高速化するための意図的な設計。
 *
 * ただし getSession() はサーバー側 JWT 検証を行わないため、
 * 実際のアクセス制御（認可）は必ず API ルート側の requireAuth() に任せること。
 *
 * NG: Proxy だけを信頼して API ルートの requireAuth() を省略する
 * OK: Proxy はリダイレクト判定のみ、認可判定は API ルートで二重確認
 *
 * 参考: https://supabase.com/docs/guides/auth/server-side/nextjs
 * ────────────────────────────────────────────────────────────────
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
