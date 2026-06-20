import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BUCKET  = 'cleaning-photos';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user || !orgId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const body   = await req.json().catch(() => ({}));
  const cleaned_date = typeof body.cleaned_date === 'string' ? body.cleaned_date : '';
  const person       = (typeof body.person === 'string' ? body.person.trim() : '').slice(0, 100);
  const notes        = (typeof body.notes  === 'string' ? body.notes.trim()  : '').slice(0, 1000);
  const photo_urls   = Array.isArray(body.photo_urls)
    ? body.photo_urls.filter((u: unknown) => typeof u === 'string').slice(0, 5)
    : [];

  if (!DATE_RE.test(cleaned_date) || !person) {
    return NextResponse.json({ error: '日付と担当者は必須です' }, { status: 400 });
  }

  const baseUpdate   = { cleaned_date, person, notes };
  const fullUpdate   = photo_urls.length > 0
    ? { ...baseUpdate, photo_urls }
    : baseUpdate;

  const { error } = await supabase
    .from('cleaning_logs')
    .update(fullUpdate)
    .eq('id', Number(id));

  if (error) {
    // photo_urls カラム未作成の場合は写真なしで再試行
    const isColumnMissing = error.code === '42703'
      || error.message?.includes('photo_urls')
      || error.message?.includes('column');

    if (photo_urls.length > 0 && isColumnMissing) {
      const { error: e2 } = await supabase
        .from('cleaning_logs')
        .update(baseUpdate)
        .eq('id', Number(id));
      if (e2) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
      return NextResponse.json({ ok: true, photos_skipped: true });
    }

    console.error('[cleaning PUT] error:', error.message);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user || !orgId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  const { data: log } = await supabase
    .from('cleaning_logs')
    .select('photo_urls')
    .eq('id', Number(id))
    .single();

  const { error } = await supabase.from('cleaning_logs').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });

  // Storage の写真を非同期で削除
  const urls: string[] = log?.photo_urls ?? [];
  if (urls.length > 0) {
    const paths = urls
      .map((url: string) => {
        const m = url.match(/cleaning-photos\/(.+)$/);
        return m ? m[1] : null;
      })
      .filter((p): p is string => p !== null)
      .filter(p => p.startsWith(`${orgId}/`));

    if (paths.length > 0) {
      supabaseAdmin.storage.from(BUCKET).remove(paths).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
