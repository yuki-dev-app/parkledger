import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

// POST → 解約（アーカイブ）
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const { reason = '' } = await req.json().catch(() => ({}));

  const rows = await sql`
    SELECT garage_id FROM contractors
    WHERE id = ${id} AND archived_at = '' AND owner_id = ${ownerId}
  `;
  if (rows.length === 0)
    return NextResponse.json({ error: '契約者が見つかりません' }, { status: 404 });

  const today    = new Date().toISOString().slice(0, 10);
  const garageId = (rows[0] as { garage_id: number }).garage_id;

  await sql.transaction([
    sql`UPDATE contractors SET archived_at=${today}, archive_reason=${reason} WHERE id=${id} AND owner_id=${ownerId}`,
    sql`UPDATE garages SET status='vacant' WHERE id=${garageId} AND owner_id=${ownerId}`,
  ]);

  return NextResponse.json({ ok: true });
}

// DELETE → 復元
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  const rows = await sql`SELECT garage_id FROM contractors WHERE id = ${id} AND owner_id = ${ownerId}`;
  if (rows.length === 0)
    return NextResponse.json({ error: '契約者が見つかりません' }, { status: 404 });

  const garageId = (rows[0] as { garage_id: number }).garage_id;

  await sql.transaction([
    sql`UPDATE contractors SET archived_at='', archive_reason='' WHERE id=${id} AND owner_id=${ownerId}`,
    sql`UPDATE garages SET status='occupied' WHERE id=${garageId} AND owner_id=${ownerId}`,
  ]);

  return NextResponse.json({ ok: true });
}
