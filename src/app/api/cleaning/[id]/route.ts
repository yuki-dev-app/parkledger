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

  const { id }                = await params;
  const { cleaned_date, person, notes } = await req.json();

  await sql`
    UPDATE cleaning_logs
    SET cleaned_date=${cleaned_date}, person=${person}, notes=${notes ?? ''}
    WHERE id=${id} AND owner_id=${ownerId}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM cleaning_logs WHERE id=${id} AND owner_id=${ownerId}`;
  return NextResponse.json({ ok: true });
}
