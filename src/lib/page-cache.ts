/**
 * ページ間ナビゲーション用のメモリキャッシュ
 * 一度読み込んだデータをセッション中保持し、再訪時に即座に表示する
 */
const store = new Map<string, unknown>();

export function getCached<T>(key: string): T | null {
  return (store.get(key) as T) ?? null;
}

export function setCached(key: string, data: unknown): void {
  store.set(key, data);
}

export function invalidateCache(...keys: string[]): void {
  if (keys.length === 0) { store.clear(); return; }
  keys.forEach(k => store.delete(k));
}
