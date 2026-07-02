/**
 * デモデータリセットAPI
 *
 * Vercel Cron から毎日呼び出され、公開デモアカウントのデータを初期状態に戻す。
 * Vercel に CRON_SECRET 環境変数を設定すると、Cron リクエストに
 * Authorization: Bearer <CRON_SECRET> が自動付与される。
 */
import { NextRequest, NextResponse } from 'next/server';
import { resetDemoData } from '@/lib/demo-seed';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await resetDemoData();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[demo/reset] failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'リセットに失敗しました' }, { status: 500 });
  }
}
