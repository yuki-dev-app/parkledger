import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

// 攻撃者が狙いやすい予測可能IDを禁止（総当たり・なりすましリスク低減）
const RESERVED_IDS = new Set([
  'admin', 'administrator', 'root', 'superuser', 'sysadmin', 'sudo',
  'support', 'help', 'info', 'contact', 'noreply', 'no-reply',
  'system', 'sys', 'api', 'app', 'web', 'mail', 'email', 'ops',
  'user', 'users', 'guest', 'test', 'demo', 'sample', 'default',
  'owner', 'manager', 'staff', 'service', 'bot', 'null', 'undefined',
  'parkledger', 'park-ledger', 'park_ledger',
]);

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data } = await supabase
    .from('org_members')
    .select('login_id')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({ login_id: data?.login_id ?? '' }, { headers: NO_CACHE_HEADERS });
}

export async function PUT(req: NextRequest) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { login_id } = await req.json().catch(() => ({}));
  // 小文字に統一して保存する（ログイン時も小文字で照合されるため。
  // 大文字のまま保存すると照合できずログイン不能になる）
  const id = typeof login_id === 'string' ? login_id.trim().toLowerCase() : '';

  // 空文字 → IDを削除
  if (!id) {
    await supabase.from('org_members').update({ login_id: null }).eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  }

  // 使用可能な文字のみ（英数字・ハイフン・アンダースコア、3〜30文字）
  if (!/^[a-z0-9_\-]{3,30}$/.test(id)) {
    return NextResponse.json({
      error: '3〜30文字の半角英数字・ハイフン(-)・アンダースコア(_)のみ使えます',
    }, { status: 400 });
  }

  // 予測可能・予約済みIDを拒否
  if (RESERVED_IDS.has(id)) {
    return NextResponse.json({ error: 'このIDは使用できません。別のIDを選んでください' }, { status: 400 });
  }

  // 他のユーザーが使っていないか（admin経由で全テナントを確認）
  const { data: existing } = await supabaseAdmin
    .from('org_members')
    .select('user_id')
    .eq('login_id', id)
    .neq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'このIDはすでに使われています' }, { status: 409 });
  }

  const { error } = await supabase
    .from('org_members')
    .update({ login_id: id })
    .eq('user_id', user.id);

  // ユニーク制約違反 = レースコンディションで先に他のユーザーが取得した
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'このIDはすでに使われています' }, { status: 409 });
    }
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
