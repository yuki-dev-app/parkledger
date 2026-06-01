import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

// ── ログイン試行のレート制限（15分間に5回まで）──
// サーバーレス環境ではインスタンスが分散するため完全ではないが、
// 単一インスタンスへの連続攻撃を抑止する基本的な保護。
const memAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = memAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    memAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 4 };
  }
  entry.count++;
  const remaining = Math.max(0, 5 - entry.count);
  return { allowed: entry.count <= 5, remaining };
}

function resetAttempts(ip: string) {
  memAttempts.delete(ip);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: { label: 'メールアドレスまたはID' },
        password:   { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials, request) {
        const identifier = (credentials?.identifier as string | undefined)?.toLowerCase().trim() ?? '';
        const password   = (credentials?.password   as string | undefined) ?? '';
        if (!identifier || !password) return null;

        // IPアドレスを取得してレート制限チェック
        const ip = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
        const { allowed } = checkRateLimit(ip);
        if (!allowed) return null; // ロック中は認証しない

        // メールアドレスまたはオリジナルIDでログイン可能
        const rows = await sql`
          SELECT id, email, password_hash
          FROM users
          WHERE (email = ${identifier} OR login_id = ${identifier})
            AND is_active = true
        ` as { id: number; email: string; password_hash: string }[];

        if (rows.length === 0) {
          // ユーザーが存在しない場合もタイミング攻撃対策でbcryptを実行
          await bcrypt.compare(password, '$2b$12$invalidhashfortiming0000000000000000000');
          return null;
        }

        const user = rows[0];
        const ok   = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        resetAttempts(ip);
        return { id: String(user.id), email: user.email, name: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const loggedIn = !!session?.user;
      const path = nextUrl.pathname;

      // 認証不要なパス
      if (
        path === '/login' ||
        path.startsWith('/setup') ||
        path.startsWith('/api/auth') ||
        path.startsWith('/_next') ||
        path === '/favicon.ico'
      ) {
        return true;
      }

      if (!loggedIn) {
        // APIルートは 401 を返す
        if (path.startsWith('/api/')) {
          return Response.json({ error: '認証が必要です' }, { status: 401 });
        }
        // ページはログインへリダイレクト
        return false;
      }

      return true;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});
