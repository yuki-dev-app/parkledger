/**
 * デモアカウント用のダミーデータ生成
 *
 * 採用担当者などが自由に触れる公開デモ環境のため、
 * /api/demo/reset から毎日呼び出してデータを初期状態に戻す。
 * データはすべて架空のもの（人名・電話番号・車両ナンバー等）。
 */
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const DEMO_LOGIN_ID = 'demo';
export const DEMO_PASSWORD = 'demo2026';
// example.com はデモ・文書用に予約されたドメイン（実在せずメールも届かない）
const DEMO_EMAIL = 'demo@parkledger.example.com';
const DEMO_ORG_NAME = 'デモ駐車場（サンプル）';

/** YYYY-MM-DD 形式 */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM 形式（monthsAgo ヶ月前） */
function yearMonth(monthsAgo: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString().slice(0, 7);
}

/** 今日から days 日ずらした日付 */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export async function resetDemoData(): Promise<void> {
  const admin = getSupabaseAdmin();

  // ── 1. デモユーザーを確保（なければ作成、あればパスワードを初期値に戻す） ──
  const { data: userList, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;

  let userId = userList.users.find((u) => u.email === DEMO_EMAIL)?.id;

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true, // 実在しないアドレスのため確認メールなしで有効化
    });
    if (createErr) throw createErr;
    userId = created.user.id;
  } else {
    // デモ利用者がパスワードを変更していても毎回初期値に戻す
    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
    });
    if (updateErr) throw updateErr;
  }

  // ── 2. デモ組織を確保 ──
  const { data: member } = await admin
    .from('org_members')
    .select('id, org_id')
    .eq('user_id', userId)
    .maybeSingle();

  let orgId = member?.org_id as string | undefined;

  if (!orgId) {
    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({ name: DEMO_ORG_NAME })
      .select('id')
      .single();
    if (orgErr) throw orgErr;
    orgId = org.id;

    const { error: memberErr } = await admin
      .from('org_members')
      .insert({ org_id: orgId, user_id: userId, role: 'owner', login_id: DEMO_LOGIN_ID });
    if (memberErr) throw memberErr;
  } else {
    // 組織名・ログインIDが変更されていても初期値に戻す
    await admin.from('organizations').update({ name: DEMO_ORG_NAME }).eq('id', orgId);
    await admin.from('org_members').update({ login_id: DEMO_LOGIN_ID }).eq('id', member!.id);
  }

  // ── 3. 既存のデモデータを全削除（外部キーの依存順） ──
  await admin.from('payments').delete().eq('org_id', orgId);
  await admin.from('contractors').delete().eq('org_id', orgId);
  await admin.from('garages').delete().eq('org_id', orgId);
  await admin.from('cleaning_logs').delete().eq('org_id', orgId);
  await admin.from('inquiries').delete().eq('org_id', orgId);
  await admin.from('settings').delete().eq('org_id', orgId);

  // ── 4. 事業者設定 ──
  const settings = {
    business_name:     'パークレジャー不動産（デモ）',
    business_address:  '京都市中京区サンプル町1-2-3（架空の住所）',
    business_phone:    '075-000-0000',
    parking_name:      '鴨川パーキング',
    parking_address:   '京都市中京区サンプル町4-5-6（架空の住所）',
    receipt_no_prefix: 'DEMO',
    cleaning_persons:  '山田, 佐藤',
  };
  {
    const rows = Object.entries(settings).map(([key, value]) => ({ org_id: orgId, key, value }));
    const { error } = await admin.from('settings').insert(rows);
    if (error) throw error;
  }

  // ── 5. 駐車区画（12区画：9契約中・3空き） ──
  const garageRows = Array.from({ length: 12 }, (_, i) => ({
    org_id: orgId,
    number: String(i + 1),
    status: i < 9 ? 'occupied' : 'vacant',
    monthly_fee: i < 4 ? 12000 : 10000,
    notes: i === 11 ? '軽自動車専用' : '',
  }));
  const { data: garages, error: garageErr } = await admin
    .from('garages')
    .insert(garageRows)
    .select('id, number, monthly_fee')
    .order('id');
  if (garageErr) throw garageErr;

  // ── 6. 契約者（すべて架空の人物・車両） ──
  const people = [
    { name: '佐藤 健一',  vehicle_type: 'トヨタ プリウス',   vehicle_number: '京都 500 あ 12-34', contract_start: '2024-04-01', contract_end: '' },
    { name: '鈴木 美咲',  vehicle_type: 'ホンダ N-BOX',      vehicle_number: '京都 580 か 56-78', contract_start: '2024-07-15', contract_end: '' },
    { name: '高橋 修',    vehicle_type: 'トヨタ カローラ',   vehicle_number: '京都 300 さ 90-12', contract_start: '2024-10-01', contract_end: '' },
    { name: '田中 由紀',  vehicle_type: 'ホンダ フィット',   vehicle_number: '京都 500 た 34-56', contract_start: '2025-01-10', contract_end: '' },
    { name: '伊藤 大輔',  vehicle_type: 'トヨタ ハイエース', vehicle_number: '京都 400 な 78-90', contract_start: '2025-03-01', contract_end: '' },
    { name: '渡辺 さくら', vehicle_type: 'トヨタ アクア',     vehicle_number: '京都 500 は 11-22', contract_start: '2025-06-20', contract_end: '' },
    { name: '山本 隆',    vehicle_type: '日産 セレナ',       vehicle_number: '京都 300 ま 33-44', contract_start: '2025-09-01', contract_end: daysFromNow(20) }, // 契約期限が近い例
    { name: '中村 恵子',  vehicle_type: 'ダイハツ タント',   vehicle_number: '京都 580 や 55-66', contract_start: '2026-01-15', contract_end: '' },
    { name: '小林 誠',    vehicle_type: 'トヨタ ヴォクシー', vehicle_number: '京都 300 ら 77-88', contract_start: '2026-04-01', contract_end: '' },
  ];
  const contractorRows = people.map((p, i) => ({
    org_id: orgId,
    garage_id: garages![i].id,
    phone: `090-0000-000${i + 1}`, // 架空の電話番号
    email: '',
    address: '京都市内（架空）',
    vehicle_chassis: '',
    emergency_contact: '',
    notes: i === 8 ? '先月分が未入金。電話連絡済み。' : '',
    archived_at: '',
    archive_reason: '',
    ...p,
  }));
  const { data: contractors, error: contractorErr } = await admin
    .from('contractors')
    .insert(contractorRows)
    .select('id, garage_id')
    .order('id');
  if (contractorErr) throw contractorErr;

  // ── 7. 入金記録（過去3ヶ月＋今月） ──
  const feeByGarage = new Map(garages!.map((g) => [g.id, g.monthly_fee]));
  const paymentRows: Array<Record<string, unknown>> = [];
  for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo--) {
    const ym = yearMonth(monthsAgo);
    contractors!.forEach((c, i) => {
      const amount = feeByGarage.get(c.garage_id) ?? 10000;
      // 今月: 6人入金済み・3人未入金 ／ 先月: 「小林 誠」のみ未入金（滞納の例）
      const unpaid =
        (monthsAgo === 0 && i >= 6) ||
        (monthsAgo === 1 && i === 8);
      paymentRows.push({
        org_id: orgId,
        contractor_id: c.id,
        year_month: ym,
        amount,
        status: unpaid ? 'unpaid' : 'paid',
        paid_date: unpaid ? '' : `${ym}-0${(i % 7) + 1}`,
        notes: '',
      });
    });
  }
  {
    const { error } = await admin.from('payments').insert(paymentRows);
    if (error) throw error;
  }

  // ── 8. 清掃記録 ──
  const cleaningRows = [
    { cleaned_date: daysFromNow(-3),  person: '山田', notes: '落ち葉の清掃、排水溝の確認' },
    { cleaned_date: daysFromNow(-10), person: '佐藤', notes: '' },
    { cleaned_date: daysFromNow(-17), person: '山田', notes: '区画線の汚れを清掃' },
    { cleaned_date: daysFromNow(-24), person: '佐藤', notes: '' },
  ].map((r) => ({ ...r, org_id: orgId, created_at: r.cleaned_date }));
  {
    const { error } = await admin.from('cleaning_logs').insert(cleaningRows);
    if (error) throw error;
  }

  // ── 9. 問い合わせ ──
  const inquiryRows = [
    { name: '松本 直樹', phone: '090-0000-0011', email: '', message: '空き区画はありますか？普通車1台分を探しています。', status: 'new',         created_at: daysFromNow(-1), notes: '' },
    { name: '井上 綾',   phone: '090-0000-0012', email: '', message: '車を買い替えたので車両情報の変更をお願いします。',   status: 'in_progress', created_at: daysFromNow(-5), notes: '新しい車検証の写真を依頼中' },
    { name: '木村 淳',   phone: '090-0000-0013', email: '', message: '領収書の再発行をお願いできますか。',                 status: 'resolved',    created_at: daysFromNow(-12), notes: '5/30 再発行済み' },
  ].map((r) => ({ ...r, org_id: orgId }));
  {
    const { error } = await admin.from('inquiries').insert(inquiryRows);
    if (error) throw error;
  }
}
