import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

// ユーザーを削除（自分自身は削除不可）
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  // 自分自身は削除できない
  if (Number(id) === ownerId) {
    return NextResponse.json({ error: '自分自身のアカウントは削除できません' }, { status: 400 });
  }

  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
