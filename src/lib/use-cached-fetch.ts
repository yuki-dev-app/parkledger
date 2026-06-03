'use client';
import type React from 'react';
/**
 * キャッシュ付きデータ取得フック
 *
 * 全ページで繰り返されていた「キャッシュ確認 → fetch → setState → setCached」
 * のパターンを共通化したカスタムフック。
 *
 * 使用例:
 *   const { data: garages, loading, reload } = useCachedFetch<Garage[]>(
 *     'garages',
 *     async () => {
 *       const res = await fetch('/api/garages');
 *       const json = await res.json().catch(() => []);
 *       return Array.isArray(json) ? json : [];
 *     },
 *     []
 *   );
 *
 * ⚠️ このフックはクライアントコンポーネント（'use client'）専用。
 *    page-cache.ts と同様にサーバーサイドでは使用しないこと。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCached, setCached } from './page-cache';

export function useCachedFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  initialValue: T,
): {
  data: T;
  loading: boolean;
  reload:  () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T>>;
} {
  const cached = getCached<T>(cacheKey);
  const [data, setData]       = useState<T>(cached ?? initialValue);
  const [loading, setLoading] = useState<boolean>(!cached);

  // fetcher の参照を安定させる（毎レンダーで新しい関数になるのを防ぐ）
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const reload = useCallback(async () => {
    const result = await fetcherRef.current();
    setCached(cacheKey, result);
    setData(result);
    setLoading(false);
  }, [cacheKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload, setData };
}
