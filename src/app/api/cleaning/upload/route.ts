/**
 * 清掃写真アップロードエンドポイント
 *
 * Supabase Storage の `cleaning-photos` バケットに写真を保存する。
 * 事前にSupabaseダッシュボードで以下の設定が必要:
 *   Storage → New Bucket → 名前: cleaning-photos → Public: OFF（非公開）
 *
 * バケットは非公開。表示には有効期限付きの署名URLを使う
 * （公開URLだとログインなしで誰でも閲覧できてしまうため）。
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateImageMagicBytes, isAllowedMimeType } from '@/lib/validate-image';
import { toStoragePath, SIGNED_URL_EXPIRES } from '@/lib/storage-paths';

const BUCKET   = 'cleaning-photos';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

  // MIMEタイプ完全一致チェック（部分一致による偽装防止）
  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json({ error: 'JPEG・PNG・WebP・HEIC形式のみ対応しています' }, { status: 400 });
  }

  // マジックバイト検証（拡張子・Content-Type の偽装を防ぐ）
  const detectedExt = await validateImageMagicBytes(file);
  if (!detectedExt) {
    return NextResponse.json({ error: '不正なファイル形式です' }, { status: 400 });
  }

  const filename = `${orgId}/${crypto.randomUUID()}.${detectedExt}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: `image/${detectedExt}`, upsert: false });

  if (error) {
    console.error('[cleaning/upload] Storage error:', error.message);
    return NextResponse.json({ error: 'アップロードに失敗しました。時間をおいて再度お試しください' }, { status: 500 });
  }

  // プレビュー表示用の署名URL（DBにはパスが保存される）
  const { data: signed } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(data.path, SIGNED_URL_EXPIRES);

  return NextResponse.json({ url: signed?.signedUrl ?? '', path: data.path });
}

export async function DELETE(req: NextRequest) {
  const { user, orgId } = await requireAuth();
  if (!user || !orgId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { path } = await req.json().catch(() => ({}));
  // URL形式で送られてきてもパスに正規化して受け付ける
  const normalized = toStoragePath(BUCKET, path);
  if (!normalized) {
    return NextResponse.json({ error: 'パスが不正です' }, { status: 400 });
  }

  // 自分のorgのファイルのみ削除可能
  if (!normalized.startsWith(`${orgId}/`)) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  await supabaseAdmin.storage.from(BUCKET).remove([normalized]);
  return NextResponse.json({ ok: true });
}
