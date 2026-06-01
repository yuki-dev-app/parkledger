import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status, paid_date, amount, notes } = body;

  await sql`
    UPDATE payments
    SET status=${status}, paid_date=${paid_date}, amount=${amount}, notes=${notes ?? ''}
    WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM payments WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
