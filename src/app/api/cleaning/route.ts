import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data } = await supabase
    .from('cleaning_logs')
    .select('*')
    .order('cleaned_date', { ascending: false });

  return NextResponse.json(data ?? [], { headers: NO_CACHE_HEADERS });
}

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user)  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '初期設定が完了していません。いったんログアウトして再度ログインしてください。' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const cleaned_date = typeof body.cleaned_date === 'string' ? body.cleaned_date.trim() : '';
  const person       = typeof body.person === 'string' ? body.person.trim().slice(0, 50) : '';
  const notes        = typeof body.notes  === 'string' ? body.notes.trim().slice(0, 1000) : '';
  const photo_urls   = Array.isArray(body.photo_urls)
    ? body.photo_urls.filter((u: unknown) => typeof u === 'string').slice(0, 5)
    : [];

  if (!cleaned_date || !person)
    return NextResponse.json({ error: '日付と担当者は必須です' }, { status: 400 });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned_date))
    return NextResponse.json({ error: '日付の形式が正しくありません（YYYY-MM-DD）' }, { status: 400 });

  // ─── 基本データ（写真なし）で必ず保存できるようにする ───────────────
  // photo_urls カラムがDBに追加されていない場合でも動作するように、
  // まず写真なしで保存し、写真がある場合だけカラムへの更新を試みる。

  const baseData = { cleaned_date, person, notes, org_id: orgId };

  // 写真がある場合は photo_urls も含めて試みる
  const insertData = photo_urls.length > 0
    ? { ...baseData, photo_urls }
    : baseData;

  const { data, error } = await supabase
    .from('cleaning_logs')
    .insert(insertData)
    .select('id').single();

  if (error) {
    // photo_urls カラムが存在しないエラーの場合、写真なしで再試行
    const isColumnMissing = error.code === '42703'
      || error.message?.includes('photo_urls')
      || error.message?.includes('column');

    if (photo_urls.length > 0 && isColumnMissing) {
      const { data: d2, error: e2 } = await supabase
        .from('cleaning_logs')
        .insert(baseData)
        .select('id').single();
      if (e2) {
        console.error('[cleaning POST] fallback error:', e2.message);
        return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
      }
      return NextResponse.json({ id: d2.id, photos_skipped: true });
    }

    console.error('[cleaning POST] error:', error.message);
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
