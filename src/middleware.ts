import { NextRequest, NextResponse } from 'next/server';

const TOKEN = process.env.SESSION_TOKEN ?? 'please-set-session-token-in-env';

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

  const auth = req.cookies.get('auth')?.value;

  if (auth !== TOKEN) {
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
