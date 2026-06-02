import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';

function esc(v: string | number) {
  const s = String(v ?? '').replace(/"/g, '""');
  // CSVインジェクション対策: 数式として解釈される文字をエスケープ
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe}"`;
}
function row(...vals: (string | number)[]) {
  return vals.map(esc).join(',');
}

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireAuth();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const year = new URL(req.url).searchParams.get('year') ?? String(new Date().getFullYear());
  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );

  const [{ data: contractors }, { data: payments }] = await Promise.all([
    supabase
      .from('contractors')
      .select('id, name, phone, address, contract_start, contract_end, garages!inner(number, monthly_fee)')
      .eq('archived_at', '')
      .order('id'),
    supabase
      .from('payments')
      .select('contractor_id, year_month, amount, status, paid_date')
      .in('year_month', months),
  ]);

  // contractor_id:year_month → payment
  const payMap = new Map<string, { status: string; paid_date: string; amount: number }>();
  for (const p of payments ?? []) {
    payMap.set(`${p.contractor_id}:${p.year_month}`, p as { status: string; paid_date: string; amount: number });
  }

  const monthLabels = months.map(ym => `${parseInt(ym.split('-')[1], 10)}月`);

  const lines: string[] = [
    `# ParkLedger  ${year}年 入金記録エクスポート`,
    `# 出力日: ${new Date().toLocaleDateString('ja-JP')}`,
    '',
    row('氏名', '区画番号', '月額(円)', ...monthLabels, '年間回収(円)', '未納回数', '住所'),
  ];

  let grandTotal = 0;
  const monthTotals = new Array(12).fill(0);

  for (const c of contractors ?? []) {
    const g = c.garages as unknown as { number: string; monthly_fee: number };
    let paidTotal = 0;
    let unpaidCount = 0;

    const cells = months.map((ym, i) => {
      const start = c.contract_start?.slice(0, 7) ?? '';
      const end   = c.contract_end?.slice(0, 7)   ?? '';
      if (start > ym || (end && end < ym)) return '−';

      const p = payMap.get(`${c.id}:${ym}`);
      if (!p) { unpaidCount++; return '未入金'; }
      if (p.status === 'paid') {
        paidTotal += p.amount;
        monthTotals[i] += p.amount;
        return `済 ${p.paid_date || ''}`.trim();
      }
      unpaidCount++;
      return '未入金';
    });

    grandTotal += paidTotal;
    lines.push(row(
      c.name, g.number, g.monthly_fee,
      ...cells,
      paidTotal, unpaidCount, c.address ?? '',
    ));
  }

  lines.push('');
  lines.push(row(
    '月別合計', '', '',
    ...monthTotals.map(t => t > 0 ? t : ''),
    grandTotal, '', '',
  ));

  const csv = '﻿' + lines.join('\r\n'); // BOM付き（Excel対応）

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="parkledger_${year}.csv"`,
    },
  });
}
