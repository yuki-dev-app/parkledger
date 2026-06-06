'use client';
import { useState } from 'react';
import { Pencil, Trash2, Phone, Car, AlertTriangle, Archive, ChevronDown, ChevronUp, X } from 'lucide-react';
import { formatDate } from '@/lib/format-date';

export type Contractor = {
  id:               number;
  garage_id:        number;
  name:             string;
  phone:            string;
  email:            string;
  address:          string;
  vehicle_type:     string;
  vehicle_number:   string;
  vehicle_chassis:  string;
  emergency_contact: string;
  contract_start:   string;
  contract_end:     string;
  notes:            string;
  garage_number:    string;
  monthly_fee:      number;
  car_photo_urls?:  string[] | null;
};

type Props = {
  contractor:  Contractor;
  days:        number | null;
  isOpen:      boolean;
  onToggle:    () => void;
  onEdit:      (c: Contractor) => void;
  onArchive:   (id: number, name: string) => void;
  onDelete:    (id: number, name: string) => void;
};

export default function ContractorCard({ contractor: c, days, isOpen, onToggle, onEdit, onArchive, onDelete }: Props) {
  const expiringSoon = days !== null && days >= 0 && days <= 30;
  const expired      = days !== null && days < 0;
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const carPhotos = c.car_photo_urls ?? [];

  return (
    <>
      {/* 車写真ライトボックス */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt={`${c.name}さんのお車`}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
          >
            <X size={24} />
          </button>
        </div>
      )}

      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
          expiringSoon ? 'border-amber-300' : expired ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        {/* 一覧行 */}
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-4 text-left"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold text-sm border border-slate-200 dark:border-slate-600 shrink-0">
              {c.garage_number}番
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-lg truncate">{c.name} さん</span>
            {expiringSoon && (
              <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                <AlertTriangle size={11} /> あと{days}日
              </span>
            )}
            {expired && (
              <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 border border-red-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                <AlertTriangle size={11} /> 期限切れ
              </span>
            )}
          </div>
          <span className="text-slate-400 dark:text-slate-500 shrink-0 ml-2">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </button>

        {/* 詳細 */}
        {isOpen && (
          <div className="border-t border-slate-100 dark:border-slate-700">
            <div className="px-4 py-4 space-y-3">

              {/* 月額・契約期間 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-0.5">月額</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">¥{c.monthly_fee?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-0.5">契約期間</p>
                  <p className={`text-base font-medium ${expiringSoon || expired ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {formatDate(c.contract_start)}<br />〜 {formatDate(c.contract_end)}
                  </p>
                </div>
              </div>

              {/* 車両情報 + 写真（複数） */}
              {(c.vehicle_type || c.vehicle_number || carPhotos.length > 0) && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1.5">お車</p>
                  {(c.vehicle_type || c.vehicle_number) && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                      <Car size={14} className="text-slate-400 shrink-0" />
                      {[c.vehicle_type, c.vehicle_number].filter(Boolean).join('　')}
                    </p>
                  )}
                  {c.vehicle_chassis && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">車台: {c.vehicle_chassis}</p>
                  )}
                  {/* 複数写真サムネイル */}
                  {carPhotos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {carPhotos.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxUrl(url)}
                          className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-600 hover:border-slate-400 shrink-0"
                          title="写真を拡大"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`車 ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 住所 */}
              {c.address && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-0.5">住所</p>
                  <p className="text-base text-slate-700 dark:text-slate-300">{c.address}</p>
                </div>
              )}

              {/* メモ */}
              {c.notes && (
                <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2">{c.notes}</p>
              )}

              {/* 電話ボタン */}
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-blue-700"
                >
                  <Phone size={18} /> {c.phone} に電話する
                </a>
              )}
            </div>

            {/* アクションバー */}
            <div className="flex divide-x divide-slate-100 dark:divide-slate-700 border-t border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/70">
              <button
                type="button"
                onClick={() => onEdit(c)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Pencil size={15} /> 編集する
              </button>
              <button
                type="button"
                onClick={() => onArchive(c.id, c.name)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-amber-600 font-medium text-sm hover:bg-amber-50"
              >
                <Archive size={15} /> 解約する
              </button>
            </div>

            {/* 完全削除 */}
            <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2 flex justify-end">
              <button
                type="button"
                onClick={() => onDelete(c.id, c.name)}
                className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={13} /> 完全に削除（全履歴消去）
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
