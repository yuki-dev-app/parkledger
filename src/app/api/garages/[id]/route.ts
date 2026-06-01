import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { monthly_fee, notes } = body;
  let { status } = body;

  // 自分のオーナーの区画かチェック
  const owned = await sql`SELECT id FROM garages WHERE id = ${id} AND owner_id = ${ownerId}`;
  if (owned.length === 0) return NextResponse.json({ error: '区画が見つかりません' }, { status: 404 });

  const contractor = await sql`SELECT id FROM contractors WHERE garage_id = ${id} AND archived_at = ''`;
  if (contractor.length > 0) {
    status = 'occupied';
  } else if (status === 'occupied') {
    return NextResponse.json({ error: '契約者がいないため使用中にできません' }, { status: 400 });
  }

  await sql`UPDATE garages SET status=${status}, monthly_fee=${monthly_fee}, notes=${notes} WHERE id=${id} AND owner_id=${ownerId}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  // 自分のオーナーの区画かチェック
  const owned = await sql`SELECT id FROM garages WHERE id = ${id} AND owner_id = ${ownerId}`;
  if (owned.length === 0) return NextResponse.json({ error: '区画が見つかりません' }, { status: 404 });

  const contractor = await sql`SELECT id FROM contractors WHERE garage_id = ${id} AND archived_at = ''`;
  if (contractor.length > 0)
    return NextResponse.json({ error: '契約者がいる区画は削除できません。先に契約者を削除してください。' }, { status: 400 });

  await sql`DELETE FROM garages WHERE id = ${id} AND owner_id = ${ownerId}`;
  return NextResponse.json({ ok: true });
}
