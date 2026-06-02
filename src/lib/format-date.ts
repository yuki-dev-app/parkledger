/** YYYY-MM-DD → "YYYY年M月D日"（空文字なら"未定"） */
export function formatDate(s: string): string {
  if (!s) return '未定';
  const [y, m, d] = s.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}
