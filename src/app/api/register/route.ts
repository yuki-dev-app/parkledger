import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ── レート制限 ─────────────────────────────────────────────
// 同一IPから10分間に5回まで登録試行を許可
const registerAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = registerAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    registerAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= 5;
}

// ── メールアドレス検証 ──────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  // レート制限チェック
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'しばらく時間をおいてから再試行してください' },
      { status: 429 }
    );
  }

  const body     = await req.json().catch(() => ({}));
  const email    = (typeof body.email    === 'string' ? body.email.trim().toLowerCase() : '');
  const password = (typeof body.password === 'string' ? body.password : '');

  // 入力検証
  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: '正しいメールアドレスを入力してください' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 });
  }

  // email_confirm: true でメール確認をスキップし、登録直後にログイン可能にする。
  // メール確認アリに切り替える場合: email_confirm を false に変更し、
  // Supabase Dashboard の Authentication > Settings で "Confirm email" を有効にするだけでOK。
  // （確認メールが来るようになり、/auth/callback が処理する）
  const { data: userData, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 });
    }
    return NextResponse.json({ error: '登録に失敗しました。しばらく時間をおいて再試行してください' }, { status: 500 });
  }

  // 登録時に確実にorgを作成（DBトリガーの失敗に備えた二重保証）
  if (userData?.user) {
    const userId = userData.user.id;
    // 既にorg_membersにあれば作らない
    const { data: existing } = await supabaseAdmin
      .from('org_members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .insert({ name: '新規事業者' })
        .select('id')
        .single();
      if (org) {
        try {
          await supabaseAdmin
            .from('org_members')
            .insert({ org_id: org.id, user_id: userId, role: 'owner' });
        } catch {
          // 競合は無視（DBトリガーが先に作成した場合など）
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
