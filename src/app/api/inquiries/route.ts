import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

export async function GET() {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, user, orgId } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: '組織が見つかりません' }, { status: 403 });

  const body    = await req.json().catch(() => ({}));
  const name    = (typeof body.name    === 'string' ? body.name.trim()    : '').slice(0, 100);
  const phone   = (typeof body.phone   === 'string' ? body.phone.trim()   : '').slice(0, 20);
  const email   = (typeof body.email   === 'string' ? body.email.trim()   : '').slice(0, 200);
  const message = (typeof body.message === 'string' ? body.message.trim() : '').slice(0, 2000);
  const notes   = (typeof body.notes   === 'string' ? body.notes.trim()   : '').slice(0, 1000);

  if (!name || !message)
    return NextResponse.json({ error: '氏名・内容は必須です' }, { status: 400 });

  const { data, error } = await supabase
    .from('inquiries')
    .insert({ name, phone, email, message, status: 'new', notes, org_id: orgId })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
