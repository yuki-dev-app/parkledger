/**
 * API呼び出しヘルパー
 *
 * 全ページで繰り返される fetch + JSON ヘッダー設定を共通化。
 * エラー時は { ok: false, error: string } を返す（throw しない）。
 *
 * 使用例:
 *   const res = await apiPost('/api/garages', { number: '1', monthly_fee: 10000 });
 *   if (!res.ok) { setToast({ message: res.error, kind: 'error' }); return; }
 */

type ApiResult<T = unknown> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

async function parseResult<T>(res: Response): Promise<ApiResult<T>> {
  if (res.ok) {
    const data = await res.json().catch(() => ({})) as T;
    return { ok: true, data };
  }
  const body = await res.json().catch(() => ({})) as { error?: string };
  return { ok: false, error: body.error ?? 'エラーが発生しました。時間をおいて再度お試しください' };
}

export async function apiPost<T = unknown>(url: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(url, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) });
  return parseResult<T>(res);
}

export async function apiPut<T = unknown>(url: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(url, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(body) });
  return parseResult<T>(res);
}

export async function apiDelete<T = unknown>(url: string): Promise<ApiResult<T>> {
  const res = await fetch(url, { method: 'DELETE' });
  return parseResult<T>(res);
}
