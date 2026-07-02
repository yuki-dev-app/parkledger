/**
 * Supabase Storage 写真パス処理ヘルパー（サーバー専用）
 *
 * 写真バケット（contractor-photos / cleaning-photos）は Private 運用。
 * DB には「バケット内パス」（orgId/uuid.ext）を保存し、
 * 表示時に有効期限付きの署名URLへ変換して返す。
 *
 * 旧データには公開URL形式（.../object/public/<bucket>/<path>）が
 * 保存されているため、どの形式からでもパスを取り出せるようにしている。
 */
import { supabaseAdmin } from './supabase/admin';

/** 署名URLの有効期限（秒） */
export const SIGNED_URL_EXPIRES = 60 * 60; // 1時間

/**
 * 保存値（公開URL・署名URL・素のパスのいずれか）からバケット内パスを取り出す。
 * 不正な値は null を返す。
 */
export function toStoragePath(bucket: string, value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const noQuery = value.split('?')[0];
  const marker  = `/${bucket}/`;
  const idx     = noQuery.indexOf(marker);
  const path    = (idx >= 0 ? noQuery.slice(idx + marker.length) : noQuery.replace(/^\/+/, '')).trim();
  if (!path || path.includes('..')) return null;
  return path.slice(0, 500);
}

/**
 * 保存用の正規化: 自orgのパスだけ許可する（他orgのファイル参照を防ぐ）。
 * 重複は除外し、最大 max 件まで。
 */
export function sanitizeOrgPhotoPaths(bucket: string, values: unknown, orgId: string, max: number): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const v of values) {
    if (out.length >= max) break;
    const p = toStoragePath(bucket, v);
    if (p && p.startsWith(`${orgId}/`) && !out.includes(p)) out.push(p);
  }
  return out;
}

/**
 * パス配列をまとめて署名URLに変換する（Storage API 呼び出しは1回）。
 * 戻り値: パス → 署名URL の Map。失敗時は空 Map（表示できないだけで落とさない）。
 */
export async function signPathMap(bucket: string, paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return new Map();
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrls(unique, SIGNED_URL_EXPIRES);
    if (error || !data) return new Map();
    const map = new Map<string, string>();
    for (const d of data) {
      if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * 1レコード分の保存値配列 → 表示用の署名URL配列。
 * 複数レコードをまとめて処理する場合は signPathMap を直接使うこと。
 */
export async function signPhotoUrls(bucket: string, stored: unknown): Promise<string[]> {
  if (!Array.isArray(stored)) return [];
  const paths = stored
    .map(v => toStoragePath(bucket, v))
    .filter((p): p is string => p !== null);
  const map = await signPathMap(bucket, paths);
  return paths.map(p => map.get(p)).filter((u): u is string => !!u);
}
