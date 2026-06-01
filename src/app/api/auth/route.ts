import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_TOKEN = process.env.SESSION_TOKEN;

if (!PASSWORD || !SESSION_TOKEN) {
  console.error('⛔ ADMIN_PASSWORD と SESSION_TOKEN を環境変数に設定してください');
}

// ブルートフォース対策：IPごとに失敗回数を記録（サーバー再起動でリセット）
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;      // 5回失敗でロック
const LOCKOUT_MS = 15 * 60 * 1000; // 15分

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

function isLocked(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (entry.until < Date.now()) { attempts.delete(ip); return false; }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFail(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.until < now) {
    attempts.set(ip, { count: 1, until: now + LOCKOUT_MS });
  } else {
    entry.count++;
  }
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (isLocked(ip)) {
    return NextResponse.json(
      { error: 'ログインを5回失敗しました。15分後に再試行してください。' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body;

  if (!PASSWORD || !SESSION_TOKEN) {
    return NextResponse.json({ error: 'サーバー設定エラー。管理者に連絡してください。' }, { status: 500 });
  }

  if (password !== PASSWORD) {
    recordFail(ip);
    const entry = attempts.get(ip);
    const remaining = MAX_ATTEMPTS - (entry?.count ?? 0);
    const msg = remaining > 0
      ? `パスワードが違います（あと${remaining}回失敗するとロックされます）`
      : 'パスワードが違います。15分後に再試行してください。';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  // ログイン成功：試行回数をリセット
  attempts.delete(ip);

  const isProduction = process.env.NODE_ENV === 'production';
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth', SESSION_TOKEN!, {
    httpOnly: true,          // JavaScriptからアクセス不可
    sameSite: 'lax',         // CSRF対策
    secure: isProduction,    // 本番はHTTPS必須
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30日
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('auth');
  return res;
}
