import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSettings, saveSettings } from '@/lib/settings';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  return NextResponse.json(await getSettings(ownerId));
}

export async function PUT(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const body = await req.json();
  await saveSettings(ownerId, body);
  return NextResponse.json({ ok: true });
}
