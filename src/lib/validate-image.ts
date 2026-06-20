/**
 * 画像ファイルのマジックバイト検証
 *
 * Content-Type ヘッダーはクライアントが偽装できるため、
 * ファイル先頭バイトのシグネチャで実際の形式を確認する。
 */

const MAGIC: { bytes: number[]; offset: number; ext: string }[] = [
  { bytes: [0xFF, 0xD8, 0xFF],                   offset: 0, ext: 'jpg'  }, // JPEG
  { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A], offset: 0, ext: 'png'  }, // PNG
  { bytes: [0x57, 0x45, 0x42, 0x50],             offset: 8, ext: 'webp' }, // WebP (RIFF????WEBP)
  // GIF は JavaScript埋め込みポリグロットによるXSSリスクがあるため除外
];

// HEIC/HEIF は先頭4バイトがサイズ、5〜8バイトが ftyp
const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'];

/**
 * ファイルのマジックバイトを検証し、対応する拡張子を返す。
 * 不正なファイルは null を返す。
 */
export async function validateImageMagicBytes(file: File): Promise<string | null> {
  const ab = await file.arrayBuffer();

  // HEIC/HEIF はブランドボックスで判定
  if (file.type.toLowerCase().includes('heic') || file.type.toLowerCase().includes('heif')) {
    if (ab.byteLength < 12) return null;
    const view = new DataView(ab);
    const brand = [4, 5, 6, 7].map(i => String.fromCharCode(view.getUint8(i))).join('').toLowerCase();
    return HEIC_BRANDS.some(b => brand.startsWith(b)) ? 'jpg' : null;
  }

  if (ab.byteLength < 16) return null;
  const buf = new Uint8Array(ab, 0, 16);

  for (const sig of MAGIC) {
    if (sig.offset + sig.bytes.length > buf.length) continue;
    const match = sig.bytes.every((b, i) => buf[sig.offset + i] === b);
    if (match) return sig.ext;
  }

  return null; // 一致するシグネチャなし → 拒否
}

/** MIME タイプの完全一致チェック（部分一致による偽装を防ぐ） */
const ALLOWED_EXACT_MIME = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp',
  'image/heic', 'image/heif',
  // image/gif は除外（XSSリスク）
]);

export function isAllowedMimeType(mime: string): boolean {
  return ALLOWED_EXACT_MIME.has(mime.toLowerCase().trim());
}
