/**
 * Supabase管理者クライアント（SERVICE ROLE KEY使用）
 * ⚠️ サーバーサイドのみ。絶対にクライアントに渡さないこと。
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 遅延初期化（ビルド時のenv未設定エラーを防ぐ）
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '⛔ NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を Vercel の環境変数に設定してください'
    );
  }

  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _admin;
}

// 後方互換のため named export も提供（実際には getSupabaseAdmin() を推奨）
export const supabaseAdmin = {
  get auth()    { return getSupabaseAdmin().auth; },
  get storage() { return getSupabaseAdmin().storage; },
  from: (...args: Parameters<SupabaseClient['from']>) => getSupabaseAdmin().from(...args),
};
