import { NextResponse } from 'next/server';
import { createClient, isSystemAdmin } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  if (!await isSystemAdmin()) return NextResponse.json({ error: '権限がありません' }, { status: 403 });

  // 全組織をmember数とともに取得（service roleで全データアクセス）
  const { data: orgs, error } = await supabaseAdmin
    .from('organizations')
    .select(`
      id, name, created_at,
      org_members(count)
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    orgs?.map(o => ({
      id:           o.id,
      name:         o.name,
      created_at:   o.created_at,
      member_count: (o.org_members as unknown as { count: number }[])?.[0]?.count ?? 0,
    })) ?? []
  );
}
