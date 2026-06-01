import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const {
    name, phone, email, address, vehicle_type, vehicle_number, vehicle_chassis,
    emergency_contact, contract_start, contract_end, notes,
  } = body;

  await sql`
    UPDATE contractors
    SET name=${name}, phone=${phone ?? ''}, email=${email ?? ''},
        address=${address ?? ''}, vehicle_type=${vehicle_type ?? ''},
        vehicle_number=${vehicle_number ?? ''}, vehicle_chassis=${vehicle_chassis ?? ''},
        emergency_contact=${emergency_contact ?? ''},
        contract_start=${contract_start}, contract_end=${contract_end ?? ''},
        notes=${notes ?? ''}
    WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows = await sql`SELECT garage_id FROM contractors WHERE id = ${id}`;
  if (rows.length === 0) return NextResponse.json({ error: '見つかりません' }, { status: 404 });
  const garageId = (rows[0] as { garage_id: number }).garage_id;

  await sql.transaction([
    sql`DELETE FROM payments WHERE contractor_id = ${id}`,
    sql`DELETE FROM contractors WHERE id = ${id}`,
    sql`UPDATE garages SET status = 'vacant' WHERE id = ${garageId}`,
  ]);

  return NextResponse.json({ ok: true });
}
