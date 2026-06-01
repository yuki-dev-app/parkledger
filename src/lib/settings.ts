import { sql } from './db';

export type Settings = {
  business_name: string;
  business_address: string;
  business_phone: string;
  parking_name: string;
  parking_address: string;
  receipt_no_prefix: string;
  cleaning_persons: string;
};

// 保存を許可するキーを明示的に列挙（任意キーの書き込みを防ぐ）
const ALLOWED_KEYS: Set<keyof Settings> = new Set([
  'business_name', 'business_address', 'business_phone',
  'parking_name', 'parking_address', 'receipt_no_prefix', 'cleaning_persons',
]);

export async function getSettings(ownerId: number): Promise<Settings> {
  const rows = await sql`
    SELECT key, value FROM settings WHERE owner_id = ${ownerId}
  ` as { key: string; value: string }[];
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    business_name:     map.business_name     ?? '',
    business_address:  map.business_address  ?? '',
    business_phone:    map.business_phone    ?? '',
    parking_name:      map.parking_name      ?? '',
    parking_address:   map.parking_address   ?? '',
    receipt_no_prefix: map.receipt_no_prefix ?? 'R',
    cleaning_persons:  map.cleaning_persons  ?? '',
  };
}

export async function saveSettings(ownerId: number, values: Partial<Settings>) {
  for (const [k, v] of Object.entries(values)) {
    if (!ALLOWED_KEYS.has(k as keyof Settings)) continue;
    const safeValue = typeof v === 'string' ? v.slice(0, 1000) : '';
    await sql`
      INSERT INTO settings (key, value, owner_id) VALUES (${k}, ${safeValue}, ${ownerId})
      ON CONFLICT (key, owner_id) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}
