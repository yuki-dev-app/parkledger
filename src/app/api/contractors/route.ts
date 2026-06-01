import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

const MAX_LEN = {
  name: 100, phone: 20, email: 200, address: 300,
  vehicle_type: 100, vehicle_number: 50, vehicle_chassis: 100,
  emergency_contact: 100, notes: 1000,
};
function trim(v: unknown, max: number): string {
  return (typeof v === 'string' ? v.trim() : '').slice(0, max);
}

export async function GET(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const archived = searchParams.get('archived') === '1';

  const rows = archived
    ? await sql`
        SELECT c.*, g.number AS garage_number, g.monthly_fee
        FROM contractors c JOIN garages g ON g.id = c.garage_id
        WHERE c.archived_at != '' AND c.owner_id = ${ownerId}
        ORDER BY c.archived_at DESC
      `
    : await sql`
        SELECT c.*, g.number AS garage_number, g.monthly_fee
        FROM contractors c JOIN garages g ON g.id = c.garage_id
        WHERE c.archived_at = '' AND c.owner_id = ${ownerId}
        ORDER BY LENGTH(g.number), g.number
      `;

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const garage_id          = Number(body.garage_id) || 0;
  const name               = trim(body.name,               MAX_LEN.name);
  const phone              = trim(body.phone,              MAX_LEN.phone);
  const email              = trim(body.email,              MAX_LEN.email);
  const address            = trim(body.address,            MAX_LEN.address);
  const vehicle_type       = trim(body.vehicle_type,       MAX_LEN.vehicle_type);
  const vehicle_number     = trim(body.vehicle_number,     MAX_LEN.vehicle_number);
  const vehicle_chassis    = trim(body.vehicle_chassis,    MAX_LEN.vehicle_chassis);
  const emergency_contact  = trim(body.emergency_contact,  MAX_LEN.emergency_contact);
  const contract_start     = trim(body.contract_start,     10);
  const contract_end       = trim(body.contract_end,       10);
  const notes              = trim(body.notes,              MAX_LEN.notes);

  if (!garage_id || !name || !contract_start)
    return NextResponse.json({ error: '区画・氏名・契約開始日は必須です' }, { status: 400 });

  // 自分のオーナーの区画かチェック
  const garageOwned = await sql`SELECT id FROM garages WHERE id = ${garage_id} AND owner_id = ${ownerId}`;
  if (garageOwned.length === 0)
    return NextResponse.json({ error: '区画が見つかりません' }, { status: 404 });

  const [c] = await sql.transaction([
    sql`
      INSERT INTO contractors
        (garage_id, name, phone, email, address, vehicle_type, vehicle_number, vehicle_chassis,
         emergency_contact, contract_start, contract_end, notes, owner_id)
      VALUES
        (${garage_id}, ${name}, ${phone}, ${email}, ${address}, ${vehicle_type},
         ${vehicle_number}, ${vehicle_chassis}, ${emergency_contact},
         ${contract_start}, ${contract_end}, ${notes}, ${ownerId})
      RETURNING id
    `,
    sql`UPDATE garages SET status = 'occupied' WHERE id = ${garage_id} AND owner_id = ${ownerId} RETURNING id`,
  ]);

  return NextResponse.json({ id: (c as { id: number }[])[0].id });
}
