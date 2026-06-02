/**
 * サーバーサイド用Supabaseクライアント
 * API Routes・Server Componentsで使用
 *
 * セキュリティ上の理由から必ず getUser() を使うこと。
 * getSession() はJWTを検証せず、なりすましリスクがある。
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route Handlerでは読み取り専用の場合がある（無視してよい）
          }
        },
      },
    }
  );
}

/** 現在のユーザーを取得（未認証ならnull） */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/** 現在のユーザーのorg_idを取得 */
export async function getOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  return data?.org_id ?? null;
}

/** ユーザーとorg_idをまとめて取得（API Routeで頻用） */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, orgId: null };

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  return { supabase, user, orgId: member?.org_id ?? null };
}

/** システム管理者かどうかを確認 */
export async function isSystemAdmin(): Promise<boolean> {
  const user = await getUser();
  return user?.user_metadata?.is_admin === true;
}
