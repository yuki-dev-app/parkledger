/**
 * ログインID → メールアドレス 変換エンドポイント（公開）
 * ログインページからのみ呼ばれる。レート制限あり。
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // レート制限: 同一IPから10分間に10回まで（Upstash Redis で永続化）
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`resolve-id:${ip}`, 10, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: 'しばらく時間をおいてから再試行してください' }, { status: 429 });
  }

  const { login_id } = await req.json().catch(() => ({}));
  if (!login_id || typeof login_id !== 'string') {
    return NextResponse.json({ error: 'IDを入力してください' }, { status: 400 });
  }

  const { data: member } = await supabaseAdmin
    .from('org_members')
    .select('user_id')
    .eq('login_id', login_id.trim())
    .maybeSingle();

  // 401 に統一（404だとIDが存在しないことが分かってしまうため）
  if (!member) return NextResponse.json({ error: 'IDまたはパスワードが正しくありません' }, { status: 401 });

  const { error } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
  if (error) return NextResponse.json({ error: 'IDまたはパスワードが正しくありません' }, { status: 401 });

  // ログインは /api/auth/login がサーバーサイドで完結するため、
  // このエンドポイントはIDの存在確認のみ行い、メール情報は一切返さない
  return NextResponse.json({ ok: true });
}
