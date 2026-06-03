'use client';
import { useState } from 'react';
import { X, Phone, Mail, Copy } from 'lucide-react';
import { useScrollLock } from '@/lib/use-scroll-lock';
import type { Settings } from '@/lib/settings';

import type { Row } from '../_types';

type Props = {
  reminder:     Row;
  year:         number;
  month:        number;
  settings:     Pick<Settings, 'business_name' | 'business_phone' | 'parking_name'>;
  onClose:      () => void;
  onRecord:     (row: Row, method: 'phone' | 'email' | 'other') => void;
};

/** 督促連絡モーダル（電話・メール・督促文コピー） */
export default function ReminderModal({ reminder, year, month, settings, onClose, onRecord }: Props) {
  const [copied, setCopied] = useState(false);

  useScrollLock(true); // 表示中は常にロック

  const reminderText = `${reminder.contractor_name} 様

平素よりお世話になっております。
${settings.parking_name || '駐車場'}の管理者${settings.business_name ? '、' + settings.business_name : ''}です。

${year}年${month}月分の駐車場使用料（¥${reminder.amount.toLocaleString()}）の
ご入金がまだ確認できておりません。

お忙しいところ大変恐れ入りますが、
ご確認のうえ、お振込みをお願いいたします。${settings.business_phone ? `

ご不明な点は下記までご連絡ください。
TEL: ${settings.business_phone}` : ''}`;

  const copyText = async () => {
    await navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onRecord(reminder, 'other');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:mx-4 p-5 max-h-[90dvh] overflow-y-auto modal-scroll">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-lg">{reminder.contractor_name} さんへ連絡</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 w-11 h-11"
          >
            <X size={20} />
          </button>
        </div>

        {/* 連絡先ボタン */}
        <div className="flex flex-col gap-2 mb-4">
          {reminder.phone && (
            <a
              href={`tel:${reminder.phone}`}
              onClick={() => onRecord(reminder, 'phone')}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold text-base hover:bg-emerald-700"
            >
              <Phone size={20} /> 電話する　{reminder.phone}
            </a>
          )}
          {reminder.email && (
            <a
              href={`mailto:${reminder.email}?subject=${encodeURIComponent(`【${year}年${month}月分】駐車場使用料のご確認`)}&body=${encodeURIComponent(reminderText)}`}
              onClick={() => onRecord(reminder, 'email')}
              className="flex items-center justify-center gap-2 bg-slate-700 text-white py-4 rounded-xl font-bold text-base hover:bg-slate-800"
            >
              <Mail size={18} /> メールを送る
            </a>
          )}
          {!reminder.phone && !reminder.email && (
            <p className="text-sm text-slate-500 text-center py-3 bg-slate-50 rounded-xl">
              連絡先が登録されていません
            </p>
          )}
        </div>

        {/* 督促文 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-600">督促文（コピーして使用）</label>
            <button
              type="button"
              onClick={copyText}
              className="flex items-center gap-1 text-sm text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <Copy size={13} /> {copied ? 'コピーしました' : 'コピー'}
            </button>
          </div>
          <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
            {reminderText}
          </pre>
        </div>
      </div>
    </div>
  );
}
