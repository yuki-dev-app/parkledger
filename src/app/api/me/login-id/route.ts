import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data } = await supabase
    .from('org_members')
    .select('login_id')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({ login_id: data?.login_id ?? '' });
}

export async function PUT(req: NextRequest) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { login_id } = await req.json().catch(() => ({}));
  const id = typeof login_id === 'string' ? login_id.trim() : '';

  // 空文字 → IDを削除
  if (!id) {
    await supabase.from('org_members').update({ login_id: null }).eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  }

  // 使用可能な文字のみ（英数字・ハイフン・アンダースコア、3〜30文字）
  if (!/^[a-zA-Z0-9_\-]{3,30}$/.test(id)) {
    return NextResponse.json({
      error: '3〜30文字の半角英数字・ハイフン(-)・アンダースコア(_)のみ使えます',
    }, { status: 400 });
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

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
