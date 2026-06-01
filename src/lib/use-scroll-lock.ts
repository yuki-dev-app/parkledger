'use client';
import { useEffect } from 'react';

/**
 * iOS Safari でモーダル表示中にバックグラウンドのスクロールを止めるフック。
 * overflow:hidden は iOS Safari で効かないため、position:fixed で対応。
 */
export function useScrollLock(active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    const y = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.width = '100%';
    body.style.overflowY = 'scroll';
    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      body.style.overflowY = '';
      window.scrollTo(0, y);
    };
  }, [active]);
}
