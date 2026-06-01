import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_TOKEN = process.env.SESSION_TOKEN;

if (!PASSWORD || !SESSION_TOKEN) {
  console.error('⛔ ADMIN_PASSWORD と SESSION_TOKEN を環境変数に設定してください');
}

// Upstash Redis が設定されていればRedisレート制限、なければメモリフォールバック
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'parkledger:login',
  });
}

// メモリフォールバック（Upstash未設定時）
const memoryAttempts = new Map<string, { count: number; resetAt: number }>();

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (ratelimit) {
    const result = await ratelimit.limit(ip);
    return { allowed: result.success, remaining: result.remaining };
  }

  // メモリフォールバック
  const now = Date.now();
  const entry = memoryAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    memoryAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 4 };
  }
  entry.count++;
  const remaining = Math.max(0, 5 - entry.count);
  return { allowed: entry.count <= 5, remaining };
}

function resetAttempts(ip: string) {
  memoryAttempts.delete(ip);
  // Redis側はTTLで自動リセットされるため追加操作不要
}

export async function POST(req: NextRequest) {
  if (!PASSWORD || !SESSION_TOKEN) {
    return NextResponse.json({ error: 'サーバー設定エラー。管理者に連絡してください。' }, { status: 500 });
  }

  const ip = getIp(req);
  const { allowed, remaining } = await checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: 'ログインを5回失敗しました。15分後に再試行してください。' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body;

  if (password !== PASSWORD) {
    const msg = remaining > 0
      ? `パスワードが違います（あと${remaining}回失敗するとロックされます）`
      : 'パスワードが違います。15分後に再試行してください。';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  resetAttempts(ip);

  const isProduction = process.env.NODE_ENV === 'production';
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth', SESSION_TOKEN!, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('auth');
  return res;
}
