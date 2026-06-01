import { NextRequest, NextResponse } from 'next/server';

const TOKEN = process.env.SESSION_TOKEN ?? 'please-set-session-token-in-env';

/**
 * タイミング攻撃を防ぐ定数時間文字列比較。
 * 単純な === 比較は文字列長やマッチ位置によって処理時間が変わるため、
 * トークンが推測されるリスクがある。
 */
function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a.padEnd(256, '\0'));
  const bBytes = enc.encode(b.padEnd(256, '\0'));
  let result = a.length === b.length ? 0 : 1;
  for (let i = 0; i < 256; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 認証不要なパス
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const auth = req.cookies.get('auth')?.value ?? '';

  if (!constantTimeEqual(auth, TOKEN)) {
    // APIルートは401を返す（リダイレクトしない）
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
