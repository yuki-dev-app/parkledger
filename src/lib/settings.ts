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

export async function getSettings(): Promise<Settings> {
  const rows = await sql`SELECT key, value FROM settings` as { key: string; value: string }[];
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

export async function saveSettings(values: Partial<Settings>) {
  for (const [k, v] of Object.entries(values)) {
    await sql`
      INSERT INTO settings (key, value) VALUES (${k}, ${v ?? ''})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}
