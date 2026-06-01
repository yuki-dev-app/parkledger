import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status, monthly_fee, notes } = body;

  await sql`UPDATE garages SET status=${status}, monthly_fee=${monthly_fee}, notes=${notes} WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contractor = await sql`SELECT id FROM contractors WHERE garage_id = ${id} AND archived_at = ''`;
  if (contractor.length > 0)
    return NextResponse.json({ error: '契約者がいる区画は削除できません。先に契約者を削除してください。' }, { status: 400 });

  await sql`DELETE FROM garages WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
