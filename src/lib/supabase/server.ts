/**
 * サーバーサイド用Supabaseクライアント
 * API Routes・Server Componentsで使用
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './admin';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Route Handlerでは読み取り専用の場合がある */ }
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

/**
 * ユーザーのorg_idを確保する（なければ自動作成）
 *
 * 【なぜ必要か】
 * supabase_schema.sql の古いトリガーは招待フロー専用で、
 * 自己登録（メタデータに org_id なし）では org_members が作られない。
 * supabase_self_register.sql を未実行のユーザーへの救済処理として
 * コード側でも org を自動生成する。
 */
async function ensureOrg(userId: string): Promise<string | null> {
  try {
    // admin で RLS をバイパスして確認
    const { data: member } = await supabaseAdmin
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (member?.org_id) return member.org_id;

    // ユーザーのメタデータから事業者名を取得
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
    const orgName = (authUser?.user_metadata?.business_name as string | undefined) || '新規事業者';

    // 組織を作成
    const { data: org, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .insert({ name: orgName })
      .select('id')
      .single();

    if (orgErr || !org) return null;

    // org_members を作成
    await supabaseAdmin
      .from('org_members')
      .insert({ org_id: org.id, user_id: userId, role: 'owner' });

    return org.id;
  } catch {
    return null;
  }
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

  if (data?.org_id) return data.org_id;

  // org が存在しない場合は自動作成
  return ensureOrg(user.id);
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

  if (member?.org_id) return { supabase, user, orgId: member.org_id };

  // org_members が存在しない → 自動作成（初回登録時のトリガー未実行への救済）
  const orgId = await ensureOrg(user.id);
  return { supabase, user, orgId };
}

/** システム管理者かどうかを確認（app_metadata で判定 - ユーザー自身は書き換え不可） */
export async function isSystemAdmin(): Promise<boolean> {
  const user = await getUser();
  return user?.app_metadata?.is_admin === true;
}
