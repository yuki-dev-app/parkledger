// Next.js 16: proxy.ts（旧 middleware.ts）
// Auth.jsの authorized コールバック（src/lib/auth.ts）が認証チェックを担当する
export { auth as proxy } from '@/lib/auth';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
