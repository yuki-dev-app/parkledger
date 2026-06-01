import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const archived = searchParams.get('archived') === '1';

  const rows = archived
    ? await sql`
        SELECT c.*, g.number AS garage_number, g.monthly_fee
        FROM contractors c JOIN garages g ON g.id = c.garage_id
        WHERE c.archived_at != ''
        ORDER BY c.archived_at DESC
      `
    : await sql`
        SELECT c.*, g.number AS garage_number, g.monthly_fee
        FROM contractors c JOIN garages g ON g.id = c.garage_id
        WHERE c.archived_at = ''
        ORDER BY LENGTH(g.number), g.number
      `;

  return NextResponse.json(rows);
}

const MAX_LEN = {
  name: 100, phone: 20, email: 200, address: 300,
  vehicle_type: 100, vehicle_number: 50, vehicle_chassis: 100,
  emergency_contact: 100, notes: 1000,
};

function trimStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const garage_id = Number(body.garage_id) || 0;
  const name         = trimStr(body.name,              MAX_LEN.name);
  const phone        = trimStr(body.phone,             MAX_LEN.phone);
  const email        = trimStr(body.email,             MAX_LEN.email);
  const address      = trimStr(body.address,           MAX_LEN.address);
  const vehicle_type = trimStr(body.vehicle_type,      MAX_LEN.vehicle_type);
  const vehicle_number   = trimStr(body.vehicle_number,   MAX_LEN.vehicle_number);
  const vehicle_chassis  = trimStr(body.vehicle_chassis,  MAX_LEN.vehicle_chassis);
  const emergency_contact = trimStr(body.emergency_contact, MAX_LEN.emergency_contact);
  const contract_start = trimStr(body.contract_start, 10);
  const contract_end   = trimStr(body.contract_end,   10);
  const notes          = trimStr(body.notes,           MAX_LEN.notes);

  if (!garage_id || !name || !contract_start)
    return NextResponse.json({ error: '区画・氏名・契約開始日は必須です' }, { status: 400 });

  const [c, _g] = await sql.transaction([
    sql`
      INSERT INTO contractors
        (garage_id, name, phone, email, address, vehicle_type, vehicle_number, vehicle_chassis,
         emergency_contact, contract_start, contract_end, notes)
      VALUES
        (${garage_id}, ${name}, ${phone}, ${email}, ${address}, ${vehicle_type},
         ${vehicle_number}, ${vehicle_chassis}, ${emergency_contact},
         ${contract_start}, ${contract_end}, ${notes})
      RETURNING id
    `,
    sql`UPDATE garages SET status = 'occupied' WHERE id = ${garage_id} RETURNING id`,
  ]);

  return NextResponse.json({ id: (c as { id: number }[])[0].id });
}
