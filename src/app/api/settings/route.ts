import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { getSettings, saveSettings } from '@/lib/settings';

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  return NextResponse.json(await getSettings(supabase));
}

export async function PUT(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '組織が見つかりません' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  await saveSettings(supabase, orgId, body);
  return NextResponse.json({ ok: true });
}
