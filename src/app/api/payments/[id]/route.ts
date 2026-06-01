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

  // 自分のオーナーの支払いかチェック
  const owned = await sql`SELECT id FROM payments WHERE id = ${id} AND owner_id = ${ownerId}`;
  if (owned.length === 0) return NextResponse.json({ error: '支払いが見つかりません' }, { status: 404 });

  const body = await req.json();
  const { status, paid_date, amount, notes } = body;

  await sql`
    UPDATE payments
    SET status=${status}, paid_date=${paid_date}, amount=${amount}, notes=${notes ?? ''}
    WHERE id = ${id} AND owner_id = ${ownerId}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM payments WHERE id = ${id} AND owner_id = ${ownerId}`;
  return NextResponse.json({ ok: true });
}
