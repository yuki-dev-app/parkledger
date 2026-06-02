/** 区画番号を自然順（桁数→辞書順）でソート */
export function naturalSort(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b, 'ja-JP', { numeric: true });
}
