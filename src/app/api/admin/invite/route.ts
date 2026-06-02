import { NextRequest, NextResponse } from 'next/server';
import { isSystemAdmin } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  if (!await isSystemAdmin()) return NextResponse.json({ error: '権限がありません' }, { status: 403 });

  const body      = await req.json().catch(() => ({}));
  const orgName   = (typeof body.org_name === 'string' ? body.org_name.trim()  : '').slice(0, 100);
  const email     = (typeof body.email    === 'string' ? body.email.trim().toLowerCase() : '');

  if (!orgName || !email) {
    return NextResponse.json({ error: '事業者名とメールアドレスは必須です' }, { status: 400 });
  }

  // ① 組織を作成
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ name: orgName })
    .select()
    .single();

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 });

  // ② 招待メールを送信
  //    user_metadata に org_id を埋め込む
  //    → auth.users トリガーが org_members を自動作成
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://parkledger.vercel.app';
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      org_id: org.id,
      role:   'owner',
    },
    redirectTo: `${appUrl}/auth/callback`,
  });

  if (inviteError) {
    // 招待失敗時は組織も削除してロールバック
    await supabaseAdmin.from('organizations').delete().eq('id', org.id);
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, org_id: org.id });
}
