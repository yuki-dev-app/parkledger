import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });
  const rows = await sql`SELECT id, email, login_id FROM users WHERE id = ${Number(session.user.id)}` as { id: number; email: string; login_id: string | null }[];
  const u = rows[0];
  return NextResponse.json({ id: u.id, email: u.email, login_id: u.login_id ?? '' });
}
