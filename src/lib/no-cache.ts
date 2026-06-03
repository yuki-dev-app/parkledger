/**
 * 認証済みデータのキャッシュ制御
 *
 * ユーザー固有のデータを返す API レスポンスには必ずこれを適用する。
 * CDN やブラウザのキャッシュに個人データが残るのを防ぐ。
 *
 * 使用例:
 *   return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
 */
export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
} as const;
