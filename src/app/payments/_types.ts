/** payments 画面で共有する型定義 */

export type Row = {
  contractor_id:   number;
  contractor_name: string;
  garage_number:   string;
  amount:          number;
  payment_id:      number | null;
  status:          'paid' | 'unpaid' | 'late';
  paid_date:       string;
  phone:           string;
  email:           string;
};

export type ReminderInfo = {
  contractor_id: number;
  reminded_at:   string;
  count:         number;
};
