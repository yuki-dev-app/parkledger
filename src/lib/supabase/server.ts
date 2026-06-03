/**
 * サーバーサイド用Supabaseクライアント
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
 * orgIdを app_metadata にキャッシュする（非同期・エラー無視）
 *
 * app_metadata はユーザー自身では書き換え不可（admin API のみ書き込み可能）。
 * 一度キャッシュすると getUser() の返り値に含まれるため、
 * 次回から org_members DBクエリが不要になる。
 *
 * ─── org作成の二経路について ──────────────────────────────────
 * 主経路: register/route.ts で登録時に確実に org + org_members を作成
 * 副経路: requireAuth() → ensureOrg() が主経路の失敗時にフォールバック作成
 *
 * どちらの経路も同じ supabaseAdmin を使うため RLS をバイパスして安全に作成できる。
 * 将来、主経路だけで十分と確認できた時点で ensureOrg() は削除して良い。
 * ────────────────────────────────────────────────────────────────
 */
function cacheOrgIdInMetadata(userId: string, orgId: string, currentMeta: Record<string, unknown>) {
  if (currentMeta?.org_id === orgId) return; // すでにキャッシュ済み
  supabaseAdmin.auth.admin
    .updateUserById(userId, { app_metadata: { ...currentMeta, org_id: orgId } })
    .catch(() => {}); // 非ブロッキング、失敗しても動作継続
}

/**
 * ユーザーのorg_idを確保する（なければ自動作成）
 *
 * 【なぜ必要か】
 * supabase_schema.sql の古いトリガーは招待フロー専用のため
 * 自己登録では org_members が作られない場合がある。
 * その救済処理として、org を自動生成する。
 */
async function ensureOrg(userId: string, currentMeta: Record<string, unknown> = {}): Promise<string | null> {
  try {
    // admin で RLS をバイパスして再確認
    const { data: member } = await supabaseAdmin
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (member?.org_id) {
      cacheOrgIdInMetadata(userId, member.org_id, currentMeta);
      return member.org_id;
    }

    // 組織を新規作成
    const orgName = (currentMeta?.business_name as string | undefined) || '新規事業者';
    const { data: org, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .insert({ name: orgName })
      .select('id')
      .single();

    if (orgErr || !org) return null;

    await supabaseAdmin
      .from('org_members')
      .insert({ org_id: org.id, user_id: userId, role: 'owner' });

    // 次回リクエストの高速化のためキャッシュ
    cacheOrgIdInMetadata(userId, org.id, currentMeta);
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

  // ── 高速パス: app_metadata からキャッシュ読み取り（DBクエリ不要）
  const cached = user.app_metadata?.org_id as string | undefined;
  if (cached) return cached;

  // ── 低速パス: DBクエリ
  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (data?.org_id) {
    cacheOrgIdInMetadata(user.id, data.org_id, user.app_metadata ?? {});
    return data.org_id;
  }

  return ensureOrg(user.id, user.user_metadata ?? {});
}

/** ユーザーとorg_idをまとめて取得（API Routeで頻用） */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, orgId: null };

  // ── 高速パス: app_metadata にキャッシュされていれば DBクエリ不要 ──
  // （初回以降はほぼ全てここで返る = getUser 1回のみ）
  const cachedOrgId = user.app_metadata?.org_id as string | undefined;
  if (cachedOrgId) return { supabase, user, orgId: cachedOrgId };

  // ── 低速パス: org_members テーブルから取得（初回またはキャッシュ未設定時）──
  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (member?.org_id) {
    // 次回から高速パスを使えるよう非同期でキャッシュ設定
    cacheOrgIdInMetadata(user.id, member.org_id, user.app_metadata ?? {});
    return { supabase, user, orgId: member.org_id };
  }

  // ── 組織が存在しない → 自動作成（SQL未実行ユーザーの救済）──
  const orgId = await ensureOrg(user.id, user.user_metadata ?? {});
  return { supabase, user, orgId };
}

/** 現在のユーザーのロールを取得（'owner' | 'admin' | null） */
export async function getRole(): Promise<'owner' | 'admin' | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .single();
  return (data?.role as 'owner' | 'admin') ?? null;
}

/** ownerのみが実行できる操作の認可チェック */
export async function requireOwner(): Promise<{ ok: true } | { ok: false; response: Response }> {
  const role = await getRole();
  if (role !== 'owner') {
    const { NextResponse } = await import('next/server');
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'この操作はオーナーのみ実行できます' },
        { status: 403 }
      ),
    };
  }
  return { ok: true };
}

/** システム管理者かどうかを確認（app_metadata で判定 - ユーザー自身は書き換え不可） */
export async function isSystemAdmin(): Promise<boolean> {
  const user = await getUser();
  return user?.app_metadata?.is_admin === true;
}
