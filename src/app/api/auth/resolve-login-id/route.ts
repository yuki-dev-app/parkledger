/**
 * ログインID → メールアドレス 変換エンドポイント（公開）
 * ログインページからのみ呼ばれる。レート制限あり。
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 同一IPから10分間に10回まで
const attempts = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || e.resetAt < now) { attempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 }); return true; }
  return ++e.count <= 10;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRate(ip)) {
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

  if (!member) return NextResponse.json({ error: 'IDが見つかりません' }, { status: 404 });

  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
  if (error || !user?.email) return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });

  return NextResponse.json({ email: user.email });
}
