import { NextRequest, NextResponse } from 'next/server';
import { isSystemAdmin } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isSystemAdmin()) return NextResponse.json({ error: '権限がありません' }, { status: 403 });

  const { id } = await params;

  // CASCADE設定により、所属メンバー・全データが自動削除される
  const { error } = await supabaseAdmin
    .from('organizations')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
