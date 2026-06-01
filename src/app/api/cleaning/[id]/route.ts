import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cleaned_date, person, notes } = await req.json();

  await sql`
    UPDATE cleaning_logs
    SET cleaned_date=${cleaned_date}, person=${person}, notes=${notes ?? ''}
    WHERE id=${id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sql`DELETE FROM cleaning_logs WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
