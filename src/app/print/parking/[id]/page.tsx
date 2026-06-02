import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

function toWareki(iso: string): string {
  if (!iso) return '　　　年　　月　　日';
  const d = new Date(iso);
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  if (y >= 2019 && (y > 2019 || m >= 5)) return `令和 ${y - 2018} 年 ${m} 月 ${day} 日`;
  return `${y} 年 ${m} 月 ${day} 日`;
}
function todayWareki() { return toWareki(new Date().toISOString().slice(0, 10)); }

export default async function ParkingCertPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { id } = await params;

  const { data: contractor } = await supabase
    .from('contractors')
    .select('name, address, phone, vehicle_type, vehicle_number, vehicle_chassis, contract_start, contract_end, garages!inner(number)')
    .eq('id', Number(id))
    .single();

  if (!contractor) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 text-lg">契約者が見つかりません。</p>
        <a href="/contractors" className="text-blue-700 underline mt-4 inline-block">契約者ページに戻る</a>
      </div>
    );
  }

  const c = {
    ...contractor,
    garage_number: (contractor.garages as unknown as { number: string }).number,
    garages: undefined,
  } as { name: string; address: string; phone: string; vehicle_type: string; vehicle_number: string; vehicle_chassis: string; contract_start: string; contract_end: string; garage_number: string };

  const s = await getSettings(supabase);
  const locationStr = [s.parking_address, `${c.garage_number}番区画`].filter(Boolean).join('　');
  const endStr = c.contract_end ? toWareki(c.contract_end) : '期間の定めなし';

  return (
    <>
      <div className="receipt-page bg-white">
        <div className="cert-wrapper">
          <div className="cert-title-block">
            <h1 className="cert-main-title">保管場所使用承諾証明書</h1>
            <p className="cert-subtitle">（自動車保管場所証明申請用）</p>
          </div>

          <p className="cert-intro">下記の自動車の保管場所として使用することを承諾します。</p>

          <table className="cert-table">
            <tbody>
              <tr>
                <th rowSpan={2} className="cert-th-section">申請者<br />（使用者）</th>
                <th className="cert-th-label">住　所</th>
                <td className="cert-td">{c.address || '　'}</td>
              </tr>
              <tr>
                <th className="cert-th-label">氏　名</th>
                <td className="cert-td cert-td-name">{c.name}</td>
              </tr>
              <tr>
                <th rowSpan={3} className="cert-th-section">自動車</th>
                <th className="cert-th-label">車　名</th>
                <td className="cert-td">{c.vehicle_type || '　'}</td>
              </tr>
              <tr>
                <th className="cert-th-label">登録番号</th>
                <td className="cert-td">{c.vehicle_number || '　'}</td>
              </tr>
              <tr>
                <th className="cert-th-label">車台番号</th>
                <td className="cert-td">
                  {c.vehicle_chassis || <span className="cert-blank-line">＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</span>}
                </td>
              </tr>
              <tr>
                <th rowSpan={3} className="cert-th-section">保管場所</th>
                <th className="cert-th-label">所 在 地</th>
                <td className="cert-td">{locationStr || '　'}</td>
              </tr>
              <tr>
                <th className="cert-th-label">収容能力</th>
                <td className="cert-td">１　台</td>
              </tr>
              <tr>
                <th className="cert-th-label">使用権原</th>
                <td className="cert-td">賃貸借</td>
              </tr>
              <tr>
                <th colSpan={2} className="cert-th-label cert-th-section">使 用 期 間</th>
                <td className="cert-td">{toWareki(c.contract_start)}　〜　{endStr}</td>
              </tr>
            </tbody>
          </table>

          <div className="cert-date-block">
            <p className="cert-date-text">承諾年月日　　{todayWareki()}</p>
          </div>

          <div className="cert-owner-block">
            <p className="cert-owner-title">保管場所の所有者（承諾者）</p>
            <div className="cert-owner-inner">
              <div className="cert-owner-info">
                <div className="cert-owner-row"><span className="cert-owner-label">名　称</span><span className="cert-owner-value">{s.parking_name || '　'}</span></div>
                <div className="cert-owner-row"><span className="cert-owner-label">住　所</span><span className="cert-owner-value">{s.business_address || '　'}</span></div>
                <div className="cert-owner-row"><span className="cert-owner-label">氏　名</span><span className="cert-owner-value cert-owner-name">{s.business_name || '　'}</span></div>
                {s.business_phone && <div className="cert-owner-row"><span className="cert-owner-label">電　話</span><span className="cert-owner-value">{s.business_phone}</span></div>}
              </div>
              <div className="cert-stamp-area">
                <div className="cert-stamp-circle"><span className="cert-stamp-text">印</span></div>
                <p className="cert-stamp-label">（実印または認印）</p>
              </div>
            </div>
          </div>

          <div className="cert-notes no-print">
            <p className="cert-notes-title">📋 警察署提出前のチェックリスト</p>
            <ul className="cert-notes-list">
              <li>□　車台番号を確認（車検証の右上に記載）。空欄の場合は手書きで追記</li>
              <li>□　型式・原動機の型式が必要な場合は余白に手書きで追記</li>
              <li>□　自動車の大きさ（長さ・幅・高さ）が必要な場合は車検証を参照して追記</li>
              <li>□　発行者欄（保管場所の所有者）に実印または認印を押す</li>
              <li>□　管轄警察署の公式様式と併せて提出（この書類は承諾証明書として使用）</li>
              <li>□　申請者（使用者）の住所・氏名が正確かを申請者に確認</li>
            </ul>
            <p style={{ fontSize: '9px', color: '#999', marginTop: '6px' }}>
              ※ 都道府県によって様式や必要書類が異なります。事前に管轄の警察署にご確認ください。
            </p>
          </div>

          <div className="cert-print-footer">
            <p>発行日：{todayWareki()}　　発行：{s.business_name || '　'}</p>
          </div>
        </div>
      </div>
      <PrintButton hint="印刷後、発行者欄に実印または認印を押してから申請者にお渡しください" />
      <div className="no-print h-36" />
    </>
  );
}
