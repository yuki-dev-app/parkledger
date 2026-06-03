import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/supabase/server';
import { getSettings, saveSettings } from '@/lib/settings';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  return NextResponse.json(await getSettings(supabase), { headers: NO_CACHE_HEADERS });
}

export async function PUT(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません。いったんログアウトして再度ログインしてください。' }, { status: 403 });
  const perm = await requireOwner();
  if (!perm.ok) return perm.response;

  const body = await req.json().catch(() => ({}));
  await saveSettings(supabase, orgId, body);
  return NextResponse.json({ ok: true });
}
