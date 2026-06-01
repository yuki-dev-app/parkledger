import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード',     type: 'password' },
      },
      async authorize(credentials) {
        const email    = (credentials?.email    as string | undefined)?.toLowerCase().trim() ?? '';
        const password = (credentials?.password as string | undefined) ?? '';
        if (!email || !password) return null;

        const rows = await sql`
          SELECT id, email, password_hash
          FROM users
          WHERE email = ${email} AND is_active = true
        ` as { id: number; email: string; password_hash: string }[];

        if (rows.length === 0) return null;
        const user = rows[0];

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

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
