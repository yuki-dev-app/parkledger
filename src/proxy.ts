import { NextRequest, NextResponse } from 'next/server';

// 環境変数が未設定の場合は警告を出して安全なデフォルトを使用
const SESSION_TOKEN = process.env.SESSION_TOKEN;
if (!SESSION_TOKEN) {
  // サーバー側のログに警告（画面には表示されない）
  console.warn('⚠️  SESSION_TOKEN が未設定です。Vercelの環境変数に追加してください。');
}
const TOKEN = SESSION_TOKEN ?? 'please-set-session-token-in-env';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ログインページとauth APIは認証不要
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const auth = req.cookies.get('auth')?.value;
  if (auth !== TOKEN) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
