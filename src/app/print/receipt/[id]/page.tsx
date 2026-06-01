import { sql } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

function formatAmount(n: number) { return n.toLocaleString('ja-JP'); }
function issueNo(id: number, prefix: string) { return `${prefix}${String(id).padStart(4, '0')}`; }
function formatDate(iso: string) {
  if (!iso) return '　　年　月　日';
  const d = new Date(iso);
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  if (y >= 2019 && (y > 2019 || m >= 5)) return `令和${y - 2018}年${m}月${day}日`;
  return `${y}年${m}月${day}日`;
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows = await sql`
    SELECT p.id, p.amount, p.year_month, p.paid_date,
           c.name AS contractor_name, g.number AS garage_number
    FROM payments p
    JOIN contractors c ON c.id = p.contractor_id
    JOIN garages g ON g.id = c.garage_id
    WHERE p.id = ${id}
  `;

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 text-lg">記録が見つかりません。</p>
        <a href="/payments" className="text-blue-700 underline mt-4 inline-block">入金ページに戻る</a>
      </div>
    );
  }

  const p = rows[0] as { id: number; amount: number; year_month: string; paid_date: string; contractor_name: string; garage_number: string };
  const s = await getSettings();
  const [y, m] = p.year_month.split('-');
  const issueDate = p.paid_date || new Date().toISOString().slice(0, 10);
  const no = issueNo(p.id, s.receipt_no_prefix || 'R');
  const needsStamp = p.amount >= 50000;

  return (
    <>
      <div className="receipt-page bg-white">
        <div className="rcpt-wrapper">
          <div className="rcpt-header">
            <div className="rcpt-header-left">
              <h1 className="rcpt-title">領　収　書</h1>
              <p className="rcpt-no">No. {no}</p>
            </div>
            <div className="rcpt-header-right">
              <p className="rcpt-date">{formatDate(issueDate)}</p>
            </div>
          </div>

          <div className="rcpt-recipient">
            <span className="rcpt-recipient-name">{p.contractor_name}</span>
            <span className="rcpt-recipient-suffix">　様</span>
          </div>

          <div className="rcpt-amount-block">
            <span className="rcpt-amount-label">金　額</span>
            <div className="rcpt-amount-box">
              <span className="rcpt-currency">¥</span>
              <span className="rcpt-amount-num">{formatAmount(p.amount)}</span>
              <span className="rcpt-dash">－</span>
            </div>
          </div>

          <div className="rcpt-purpose-block">
            <p className="rcpt-purpose-text">
              但し、<strong>{y}年{Number(m)}月分　駐車場使用料</strong>（{s.parking_name || '　'}　{p.garage_number}番区画）
              <br />上記の金額を正に領収いたしました。
            </p>
          </div>

          <div className="rcpt-tax-block">
            <span className="rcpt-tax-text">
              ※住宅用駐車場使用料は消費税非課税です（消費税法施行令第8条）
            </span>
          </div>

          <div className="rcpt-footer-block">
            <div className={`rcpt-stamp-box ${needsStamp ? 'rcpt-stamp-required' : ''}`}>
              <p className="rcpt-stamp-box-title">収入印紙</p>
              <p className="rcpt-stamp-box-note">{needsStamp ? '（200円）' : '不要'}</p>
              {!needsStamp && <p className="rcpt-stamp-box-sub">（5万円未満）</p>}
            </div>
            <div className="rcpt-issuer">
              <div className="rcpt-issuer-info">
                {s.business_address && <p className="rcpt-issuer-row">{s.business_address}</p>}
                <p className="rcpt-issuer-name">{s.business_name || '（事業者名 未設定）'}</p>
                {s.business_phone && <p className="rcpt-issuer-row">TEL {s.business_phone}</p>}
              </div>
              <div className="rcpt-hanko-area">
                <div className="rcpt-hanko-circle"><span className="rcpt-hanko-text">印</span></div>
              </div>
            </div>
          </div>

          {!s.business_name && (
            <div className="no-print rcpt-warn">
              ⚠️ 事業者名が未設定です。「設定」画面で入力してください。
            </div>
          )}
        </div>
      </div>
      <PrintButton />
      <div className="no-print h-28" />
    </>
  );
}
