import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

function formatAmount(n: number) { return n.toLocaleString('ja-JP'); }

function issueNo(id: number, prefix: string) {
  return `${prefix}${String(id).padStart(4, '0')}`;
}

function formatDate(iso: string) {
  if (!iso) return '　　年　月　日';
  const d = new Date(iso);
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  if (y >= 2019 && (y > 2019 || m >= 5)) return `令和${y - 2018}年${m}月${day}日`;
  return `${y}年${m}月${day}日`;
}

/** 金額を大字（漢数字）に変換　例: 10000 → 壱万円也 */
function toDaiji(num: number): string {
  if (num === 0) return '零円也';
  const kanji = ['', '壱', '弐', '参', '四', '伍', '六', '七', '八', '九'];
  const unit4 = ['', '拾', '百', '千'];
  const unit8 = ['', '万', '億'];

  let s = String(num);
  const groups: string[] = [];
  while (s.length > 0) {
    const cut = s.length > 4 ? s.length - 4 : 0;
    groups.unshift(s.slice(cut));
    s = s.slice(0, cut);
  }

  let result = '';
  groups.forEach((g, i) => {
    const unitIdx = groups.length - 1 - i;
    const n = parseInt(g, 10);
    if (n === 0) return;
    const padded = g.padStart(4, '0').split('').map(Number);
    let part = '';
    padded.forEach((d, j) => {
      const u = unit4[3 - j];
      if (d === 0) return;
      if (d === 1 && u) { part += u; } else { part += kanji[d] + u; }
    });
    result += part + unit8[unitIdx];
  });

  return `金　${result}円也`;
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const ownerId = Number(session.user.id);

  const { id } = await params;

  const rows = await sql`
    SELECT p.id, p.amount, p.year_month, p.paid_date,
           c.name AS contractor_name, c.address AS contractor_address,
           g.number AS garage_number
    FROM payments p
    JOIN contractors c ON c.id = p.contractor_id
    JOIN garages g ON g.id = c.garage_id
    WHERE p.id = ${id} AND p.owner_id = ${ownerId}
  `;

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 text-lg">記録が見つかりません。</p>
        <a href="/payments" className="text-blue-700 underline mt-4 inline-block">入金ページに戻る</a>
      </div>
    );
  }

  const p = rows[0] as {
    id: number; amount: number; year_month: string; paid_date: string;
    contractor_name: string; contractor_address: string; garage_number: string;
  };
  const s = await getSettings(ownerId);
  const [y, m] = p.year_month.split('-');
  const issueDate = p.paid_date || new Date().toISOString().slice(0, 10);
  const no = issueNo(p.id, s.receipt_no_prefix || 'R');
  const needsStamp = p.amount >= 50000;

  return (
    <>
      <div className="receipt-page bg-white">
        <div className="rcpt-wrapper">

          {/* ヘッダー：タイトル + 番号 + 日付 */}
          <div className="rcpt-header">
            <div className="rcpt-header-left">
              <h1 className="rcpt-title">領　収　書</h1>
              <p className="rcpt-no">No.　{no}</p>
            </div>
            <div className="rcpt-header-right">
              <p className="rcpt-date">{formatDate(issueDate)}</p>
            </div>
          </div>

          {/* 宛名（住所 + 氏名） */}
          <div style={{ marginBottom: '18px' }}>
            {p.contractor_address && (
              <p style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>
                〒　{p.contractor_address}
              </p>
            )}
            <div className="rcpt-recipient">
              <span className="rcpt-recipient-name">{p.contractor_name}</span>
              <span className="rcpt-recipient-suffix">　様</span>
            </div>
          </div>

          {/* 金額（数字） */}
          <div className="rcpt-amount-block">
            <span className="rcpt-amount-label">金　額</span>
            <div className="rcpt-amount-box">
              <span className="rcpt-currency">¥</span>
              <span className="rcpt-amount-num">{formatAmount(p.amount)}</span>
              <span className="rcpt-dash">－</span>
            </div>
          </div>

          {/* 金額（大字）— 改ざん防止 */}
          <div style={{
            fontSize: '13px', color: '#333', marginBottom: '14px',
            padding: '8px 12px', border: '1px solid #ddd', borderRadius: '3px',
            background: '#fafafa', letterSpacing: '0.08em',
          }}>
            {toDaiji(p.amount)}
          </div>

          {/* 但し書き */}
          <div className="rcpt-purpose-block">
            <p className="rcpt-purpose-text">
              但し、<strong>{y}年{Number(m)}月分　駐車場使用料</strong>
              （{s.parking_name || '　'}　{p.garage_number}番区画）
              <br />上記の金額を正に領収いたしました。
            </p>
          </div>

          {/* 消費税メモ */}
          <div className="rcpt-tax-block">
            <span className="rcpt-tax-text">
              ※ 住宅用駐車場使用料は消費税非課税です（消費税法施行令第8条）
            </span>
          </div>

          {/* フッター：収入印紙 + 発行者 */}
          <div className="rcpt-footer-block">
            <div className={`rcpt-stamp-box ${needsStamp ? 'rcpt-stamp-required' : ''}`}>
              <p className="rcpt-stamp-box-title">収入印紙</p>
              <p className="rcpt-stamp-box-note">{needsStamp ? '200円' : '不要'}</p>
              <p className="rcpt-stamp-box-sub">{needsStamp ? '（5万円以上）' : '（5万円未満）'}</p>
            </div>
            <div className="rcpt-issuer">
              <div className="rcpt-issuer-info">
                {s.business_address && <p className="rcpt-issuer-row">{s.business_address}</p>}
                <p className="rcpt-issuer-name">{s.business_name || '（事業者名 未設定）'}</p>
                {s.business_phone && <p className="rcpt-issuer-row">TEL　{s.business_phone}</p>}
              </div>
              <div className="rcpt-hanko-area">
                <div className="rcpt-hanko-circle">
                  <span className="rcpt-hanko-text">印</span>
                </div>
                <p style={{ fontSize: '8px', color: '#888', textAlign: 'center', marginTop: '3px', whiteSpace: 'nowrap' }}>
                  実印または認印
                </p>
              </div>
            </div>
          </div>

          {/* 画面のみ：未設定警告 */}
          {!s.business_name && (
            <div className="no-print rcpt-warn">
              ⚠️ 事業者名が未設定です。「設定」画面で入力してください。
            </div>
          )}

          {/* 画面のみ：収入印紙の案内（5万円以上） */}
          {needsStamp && (
            <div className="no-print" style={{
              marginTop: '12px', padding: '10px 14px',
              background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px',
              fontSize: '12px', color: '#856404',
            }}>
              💡 金額が5万円以上のため、200円の収入印紙が必要です。印紙を貼り、消印してからお渡しください。
            </div>
          )}
        </div>
      </div>

      <PrintButton hint="印刷後、発行者欄に印鑑を押してお渡しください" />
      <div className="no-print h-36" />
    </>
  );
}
