import type { SupabaseClient } from '@supabase/supabase-js';

export type Settings = {
  business_name:     string;
  business_address:  string;
  business_phone:    string;
  parking_name:      string;
  parking_address:   string;
  receipt_no_prefix: string;
  cleaning_persons:  string;
};

const ALLOWED_KEYS = new Set<keyof Settings>([
  'business_name', 'business_address', 'business_phone',
  'parking_name', 'parking_address', 'receipt_no_prefix', 'cleaning_persons',
]);

/** RLS が自動的にorgフィルタリングするため、org_id指定不要 */
export async function getSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data } = await supabase
    .from('settings')
    .select('key, value');

  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
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

export async function saveSettings(supabase: SupabaseClient, orgId: string, values: Partial<Settings>) {
  const rows = Object.entries(values)
    .filter(([k]) => ALLOWED_KEYS.has(k as keyof Settings))
    .map(([key, value]) => ({
      org_id: orgId,
      key,
      value: typeof value === 'string' ? value.slice(0, 1000) : '',
    }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('settings')
    .upsert(rows, { onConflict: 'org_id,key' });

  if (error) throw new Error(error.message);
}
