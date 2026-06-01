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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    garage_id, name, phone = '', email = '',
    address = '', vehicle_type = '', vehicle_number = '', vehicle_chassis = '',
    emergency_contact = '', contract_start, contract_end = '', notes = '',
  } = body;

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
