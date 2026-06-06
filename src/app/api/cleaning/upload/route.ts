/**
 * 清掃写真アップロードエンドポイント
 *
 * Supabase Storage の `cleaning-photos` バケットに写真を保存する。
 * 事前にSupabaseダッシュボードで以下の設定が必要:
 *   Storage → New Bucket → 名前: cleaning-photos → Public: ON
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const BUCKET      = 'cleaning-photos';
const MAX_SIZE    = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(req: NextRequest) {
  const { user, orgId } = await requireAuth();
  if (!user || !orgId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'フォームデータが不正です' }, { status: 400 });

  const file = formData.get('photo') as File | null;
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: '写真ファイルが見つかりません' }, { status: 400 });
  }

  // サイズ検証
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 });
  }

  // MIMEタイプ検証（サーバーサイドで必ず実施）
  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME.some(a => mime.includes(a.split('/')[1]))) {
    return NextResponse.json({ error: 'JPEG・PNG・WebP・HEIC形式のみ対応しています' }, { status: 400 });
  }

  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const filename = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: `image/${ext}`, upsert: false });

  if (error) {
    console.error('[cleaning/upload] Storage error:', error.message);
    return NextResponse.json({ error: 'アップロードに失敗しました。時間をおいて再度お試しください' }, { status: 500 });
  }

  // Public URL を返す（バケットが Public の場合）
  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl, path: data.path });
}

export async function DELETE(req: NextRequest) {
  const { user, orgId } = await requireAuth();
  if (!user || !orgId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { path } = await req.json().catch(() => ({}));
  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'パスが不正です' }, { status: 400 });
  }

  // 自分のorgのファイルのみ削除可能
  if (!path.startsWith(`${orgId}/`)) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  await supabaseAdmin.storage.from(BUCKET).remove([path]);
  return NextResponse.json({ ok: true });
}
