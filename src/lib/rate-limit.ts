/**
 * 永続レート制限 (Upstash Redis ベース)
 *
 * サーバーレス環境では in-memory Map はリクエストごとにリセットされるため無効。
 * Upstash Redis を使い、インスタンスをまたいで状態を共有する。
 *
 * セットアップ:
 *   1. https://upstash.com で Redis インスタンスを作成
 *   2. Vercel 環境変数に追加:
 *      UPSTASH_REDIS_REST_URL=https://...
 *      UPSTASH_REDIS_REST_TOKEN=...
 *   3. ローカルは .env.local にも追加
 *
 * 未設定の場合はフォールバックとして in-memory を使用（ローカル開発用）
 */

import { NextRequest } from 'next/server';

// ── Upstash が設定されているかチェック ───────────────────────
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH   = !!(UPSTASH_URL && UPSTASH_TOKEN);

// ── フォールバック用 in-memory（開発環境のみ） ──────────────
const fallbackStore = new Map<string, { count: number; resetAt: number }>();

/**
 * IPアドレスを取得する（プロキシ経由も考慮）
 */
export function getClientIp(req: NextRequest): string {
  // Bug5修正: Vercel環境では x-vercel-forwarded-for が信頼できる実クライアントIP。
  // x-forwarded-for はクライアントが偽装可能（末尾がプロキシ追加分のため最後を使う）。
  // Vercel以外の環境では x-real-ip にフォールバック。
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // 信頼できるプロキシ経由の場合、最後のIPが実クライアント
    const ips = forwarded.split(',').map(s => s.trim());
    return ips[ips.length - 1] ?? 'unknown';
  }

  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * レート制限チェック
 * @param key     制限のキー（例: `register:${ip}`、`login-id:${ip}`）
 * @param max     最大リクエスト数
 * @param windowMs ウィンドウ時間（ミリ秒）
 * @returns       { allowed: boolean; remaining: number }
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  if (USE_UPSTASH) {
    return checkUpstash(key, max, windowMs);
  }
  return checkFallback(key, max, windowMs);
}

// ── Upstash 実装 ────────────────────────────────────────────
async function checkUpstash(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowSec = Math.ceil(windowMs / 1000);
    const redisKey  = `rl:${key}`;

    // INCR + EXPIRE をパイプラインで送信
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, windowSec, 'NX'], // 初回のみ TTL を設定
      ]),
    });

    if (!res.ok) throw new Error('Upstash pipeline failed');

    const data    = await res.json() as [{ result: number }, unknown];
    const count   = data[0].result;
    const allowed = count <= max;
    return { allowed, remaining: Math.max(0, max - count) };
  } catch {
    // Upstash 障害時は許可（可用性優先）
    console.error('[rate-limit] Upstash error, allowing request');
    return { allowed: true, remaining: max };
  }
}

// ── フォールバック実装（開発環境用） ────────────────────────
function checkFallback(
  key: string,
  max: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now   = Date.now();
  const entry = fallbackStore.get(key);

  if (!entry || entry.resetAt < now) {
    fallbackStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  entry.count++;
  const allowed = entry.count <= max;
  return { allowed, remaining: Math.max(0, max - entry.count) };
}
