import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { NO_CACHE_HEADERS } from '@/lib/no-cache';

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  const ownerCheck = await requireOwner();
  if (!ownerCheck.ok) return ownerCheck.response;

  const ym = new URL(req.url).searchParams.get('year_month');
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return NextResponse.json({ error: 'year_month の形式が正しくありません' }, { status: 400 });

  const [year, month] = ym.split('-');
  const today    = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const settings = await getSettings(supabase);

  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, name, phone, email, address, contract_start, contract_end, garages!inner(number, monthly_fee)')
    .eq('archived_at', '');

  const eligible = (contractors ?? []).filter(c => {
    const s = c.contract_start?.slice(0, 7);
    const e = c.contract_end?.slice(0, 7) || '';
    return s <= ym && (!e || e >= ym);
  });

  const { data: payments } = await supabase
    .from('payments')
    .select('contractor_id, status, paid_date')
    .eq('year_month', ym);

  const payMap = new Map((payments ?? []).map(p => [p.contractor_id, p]));

  const rows = eligible.map(c => {
    const p = payMap.get(c.id);
    return {
      garage_number:    (c.garages as unknown as { number: string }).number,
      contractor_name:  c.name,
      phone:            c.phone,
      email:            c.email,
      address:          c.address,
      contract_start:   c.contract_start,
      contract_end:     c.contract_end,
      amount:           (c.garages as unknown as { monthly_fee: number }).monthly_fee,
      status:           p?.status ?? 'unpaid',
      paid_date:        p?.paid_date ?? '',
    };
  });

  // CSVインジェクション対策: =,+,-,@で始まる値は強制クォート
  const q = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    if (/^[=+\-@\t]/.test(s) || /[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const paidRows   = rows.filter(r => r.status === 'paid');
  const unpaidRows = rows.filter(r => r.status !== 'paid');
  const paidTotal  = paidRows.reduce((s, r) => s + r.amount, 0);
  const unpaidTotal= unpaidRows.reduce((s, r) => s + r.amount, 0);

  // Bug12修正: ヘッダー行もq()でエスケープ（parking_name等にカンマ・改行が入る可能性）
  const lines: string[] = [
    `ParkLedger　入金管理レポート`,
    `駐車場名：${q(settings.parking_name || '（未設定）')}`,
    `管理者：${q(settings.business_name || '（未設定）')}`,
    `対象月：${year}年${Number(month)}月`,
    `作成日：${today}`,
    '',
    '■ 入金明細',
    ['区画番号','契約者名','月額（円）','入金状況','入金日','電話番号','メール','契約開始','契約終了','住所'].map(q).join(','),
    ...rows.map(r => [r.garage_number, r.contractor_name, r.amount, r.status === 'paid' ? '入金済' : '未入金', r.paid_date, r.phone, r.email, r.contract_start, r.contract_end || '期間の定めなし', r.address].map(q).join(',')),
    '',
    '■ 集計',
    ['','件数','金額（円）'].join(','),
    ['入金済み', paidRows.length + '名', paidTotal].map(q).join(','),
    ['未入金',   unpaidRows.length + '名', unpaidTotal].map(q).join(','),
    ['合計',     rows.length + '名', paidTotal + unpaidTotal].map(q).join(','),
    '',
    '■ 経理・税務メモ',
    '消費税区分,非課税（住宅用駐車場）',
    `※ ParkLedgerが自動生成しました`,
  ];

  const csv      = '﻿' + lines.join('\r\n');
  const filename = `入金レポート_${settings.parking_name || 'ParkLedger'}_${year}年${month}月.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      ...NO_CACHE_HEADERS,
    },
  });
}
