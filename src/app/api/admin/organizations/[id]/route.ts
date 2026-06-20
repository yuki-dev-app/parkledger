import { NextRequest, NextResponse } from 'next/server';
import { isSystemAdmin } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isSystemAdmin()) return NextResponse.json({ error: '権限がありません' }, { status: 403 });

  const { id } = await params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: '不正なIDです' }, { status: 400 });

  // CASCADE設定により、所属メンバー・全データが自動削除される
  const { error } = await supabaseAdmin
    .from('organizations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[admin/organizations DELETE]', error.message);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
