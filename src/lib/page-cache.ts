/**
 * ページ間ナビゲーション用のメモリキャッシュ
 * 一度読み込んだデータをセッション中保持し、再訪時に即座に表示する
 * TTL: 3分（古すぎるキャッシュは無効化）
 */
const TTL_MS = 3 * 60 * 1000; // 3分

const store = new Map<string, { data: unknown; expiresAt: number }>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown): void {
  store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCache(...keys: string[]): void {
  if (keys.length === 0) { store.clear(); return; }
  keys.forEach(k => store.delete(k));
}
