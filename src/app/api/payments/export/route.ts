import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getSettings } from '@/lib/settings';

async function getOwnerId() {
  const session = await auth();
  return Number(session?.user?.id) || 0;
}

export async function GET(req: NextRequest) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ym = searchParams.get('year_month');
  if (!ym) return NextResponse.json({ error: 'year_month は必須です' }, { status: 400 });

  const [year, month] = ym.split('-');
  const today    = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const settings = await getSettings(ownerId);

  const rows = await sql`
    SELECT
      g.number        AS garage_number,
      c.name          AS contractor_name,
      c.phone,
      c.email,
      c.address,
      c.contract_start,
      c.contract_end,
      g.monthly_fee   AS amount,
      COALESCE(p.status, 'unpaid') AS status,
      COALESCE(p.paid_date, '')    AS paid_date
    FROM contractors c
    JOIN  garages g  ON g.id = c.garage_id
    LEFT JOIN payments p ON p.contractor_id = c.id AND p.year_month = ${ym}
    WHERE c.archived_at = ''
      AND c.owner_id = ${ownerId}
      AND LEFT(c.contract_start, 7) <= ${ym}
      AND (c.contract_end = '' OR LEFT(c.contract_end, 7) >= ${ym})
    ORDER BY LENGTH(g.number), g.number
  ` as {
    garage_number: string; contractor_name: string; phone: string; email: string;
    address: string; contract_start: string; contract_end: string;
    amount: number; status: string; paid_date: string;
  }[];

  const q = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const paidRows    = rows.filter(r => r.status === 'paid');
  const unpaidRows  = rows.filter(r => r.status !== 'paid');
  const paidTotal   = paidRows.reduce((s, r)   => s + r.amount, 0);
  const unpaidTotal = unpaidRows.reduce((s, r) => s + r.amount, 0);
  const grandTotal  = rows.reduce((s, r)       => s + r.amount, 0);

  const lines: string[] = [];
  lines.push(`ParkLedger　入金管理レポート`);
  lines.push(`駐車場名：${settings.parking_name || '（未設定）'}`);
  lines.push(`管理者：${settings.business_name || '（未設定）'}`);
  lines.push(`対象月：${year}年${Number(month)}月`);
  lines.push(`作成日：${today}`);
  lines.push('');
  lines.push('■ 入金明細');
  lines.push(['区画番号', '契約者名', '月額（円）', '入金状況', '入金日', '電話番号', 'メール', '契約開始', '契約終了', '住所'].map(q).join(','));

  for (const r of rows) {
    lines.push([
      r.garage_number, r.contractor_name, r.amount,
      r.status === 'paid' ? '入金済' : '未入金',
      r.paid_date, r.phone, r.email, r.contract_start,
      r.contract_end || '期間の定めなし', r.address,
    ].map(q).join(','));
  }
  lines.push('');
  lines.push('■ 集計');
  lines.push(['', '件数', '金額（円）'].join(','));
  lines.push(['入金済み', paidRows.length + '名',   paidTotal].map(q).join(','));
  lines.push(['未入金',   unpaidRows.length + '名', unpaidTotal].map(q).join(','));
  lines.push(['合計',     rows.length + '名',       grandTotal].map(q).join(','));
  lines.push('');
  lines.push('■ 経理・税務メモ');
  lines.push('勘定科目,個人オーナー：地代家賃　／　法人オーナー：賃借料（借入側）/ 賃貸料収入（貸出側）');
  lines.push('消費税区分,非課税（住宅用駐車場　消費税法施行令第8条）');
  lines.push('帳簿保存期間,確定申告書の提出期限から5年（所得税法施行規則第56条）');
  lines.push('');
  lines.push(`※ このファイルはParkLedgerが自動生成しました。税務申告の際は税理士にご確認ください。`);

  const csv      = '﻿' + lines.join('\r\n');
  const filename = `入金レポート_${settings.parking_name || 'ParkLedger'}_${year}年${month}月.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
