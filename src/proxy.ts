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
const PUBLIC_PATHS = new Set(['/login', '/register', '/auth/callback', '/auth/confirm', '/privacy', '/terms', '/help', '/reset-password', '/reset-password/confirm']);

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  if (path.startsWith('/_next')) return true;
  if (path === '/favicon.ico') return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // APIルートは全てここで早期リターン（ページリダイレクトロジックに入らせない）
  if (path.startsWith('/api/')) {
    // CSRF対策: 状態変更リクエスト（POST/PUT/DELETE等）は Origin を検証する。
    // SameSite Cookie による防御に加えた二重防御。
    // Origin ヘッダーが無いリクエスト（非ブラウザクライアント等）は
    // Cookie も付かないため許可してよい。
    const method = request.method;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const origin = request.headers.get('origin');
      if (origin) {
        let originHost: string | null = null;
        try { originHost = new URL(origin).host; } catch { /* 不正なOriginはnullのまま */ }
        if (originHost !== request.nextUrl.host) {
          return NextResponse.json({ error: '不正なリクエスト元です' }, { status: 403 });
        }
      }
    }

    // 認証不要な公開APIは Cookie チェックをスキップ
    const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/register'];
    if (PUBLIC_API_PREFIXES.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }
    // 認証が必要なAPIルート: セッションCookieの存在をファストチェック
    // 完全な認証検証は各 Route Handler の requireAuth() が担う
    const hasCookie = request.cookies.getAll().some(
      c => c.name.startsWith('sb-') && c.name.includes('-auth-token')
    );
    if (!hasCookie) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    return NextResponse.next();
  }

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
