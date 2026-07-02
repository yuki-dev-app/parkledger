'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Check, Sparkles, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import { useCachedFetch } from '@/lib/use-cached-fetch';
import Toast, { ToastType } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import { inputCls } from '@/lib/styles';

type CleaningLog = {
  id:           number;
  cleaned_date: string;
  person:       string;
  notes:        string;
  photo_urls:   string[] | null;
  created_at:   string;
};

type PhotoItem = {
  url:      string;   // 表示用URL（アップロード済み or プレビュー）
  path?:    string;   // Storage path（アップロード済みのみ）
  preview?: string;   // ローカルプレビュー用 object URL
  uploading?: boolean;
};

const emptyForm = { cleaned_date: '', person: '', notes: '', personSelect: '' };
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

export default function CleaningPage() {
  const { data: logs, reload: load } = useCachedFetch<CleaningLog[]>(
    'cleaning',
    async () => {
      const res  = await fetch('/api/cleaning');
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? json : [];
    },
    [],
  );

  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<CleaningLog | null>(null);
  const [form,         setForm]         = useState(emptyForm);
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState<ToastType | null>(null);
  const [persons,      setPersons]      = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; date: string } | null>(null);
  const [photos,       setPhotos]       = useState<PhotoItem[]>([]);
  const [lightbox,     setLightbox]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json()).catch(() => ({}))
      .then((s: { cleaning_persons?: string }) => {
        setPersons(
          s.cleaning_persons
            ? s.cleaning_persons.split(',').map(p => p.trim()).filter(Boolean)
            : []
        );
      });
  }, []);

  // フォームを閉じるときにプレビューURLを解放
  const closeForm = () => {
    photos.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
    setPhotos([]);
    setShowForm(false);
  };

  const openNew = () => {
    setForm({ ...emptyForm, cleaned_date: today() });
    setEditTarget(null);
    setPhotos([]);
    setShowForm(true);
  };

  const openEdit = (log: CleaningLog) => {
    const isInList = persons.includes(log.person);
    setForm({
      cleaned_date: log.cleaned_date,
      person:       log.person,
      personSelect: isInList ? log.person : '__other__',
      notes:        log.notes ?? '',
    });
    // 既存写真をPhotoItemとして設定
    setPhotos(
      (log.photo_urls ?? []).map(url => ({
        url,
        path: extractPath(url),
      }))
    );
    setEditTarget(log);
    setShowForm(true);
  };

  const extractPath = (url: string): string => {
    const m = url.match(/cleaning-photos\/(.+)$/);
    return m ? m[1] : '';
  };

  // 写真を選択してアップロード
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // 最大5枚
    const remain = 5 - photos.length;
    const targets = files.slice(0, remain);
    if (targets.length === 0) {
      setToast({ message: '写真は最大5枚まで追加できます', kind: 'error' });
      return;
    }

    for (const file of targets) {
      if (file.size > 10 * 1024 * 1024) {
        setToast({ message: `${file.name}: ファイルサイズは10MB以下にしてください`, kind: 'error' });
        continue;
      }

      const preview = URL.createObjectURL(file);
      const placeholder: PhotoItem = { url: preview, preview, uploading: true };
      setPhotos(prev => [...prev, placeholder]);

      const fd = new FormData();
      fd.append('photo', file);

      const res = await fetch('/api/cleaning/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        URL.revokeObjectURL(preview);
        setPhotos(prev => prev.filter(p => p.preview !== preview));
        setToast({ message: d.error ?? 'アップロードに失敗しました', kind: 'error' });
        continue;
      }

      const { url, path } = await res.json();
      URL.revokeObjectURL(preview);
      setPhotos(prev =>
        prev.map(p => p.preview === preview ? { url, path, uploading: false } : p)
      );
    }

    // inputをリセット（同じファイルを再選択できるように）
    if (fileRef.current) fileRef.current.value = '';
  };

  // 写真を削除
  const removePhoto = async (index: number) => {
    const photo = photos[index];
    if (photo.uploading) return;

    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (photo.preview) URL.revokeObjectURL(photo.preview);

    // Storage からも削除
    if (photo.path) {
      fetch('/api/cleaning/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: photo.path }),
      }).catch(() => {});
    }
  };

  const save = async () => {
    if (photos.some(p => p.uploading)) {
      setToast({ message: '写真のアップロードが完了するまでお待ちください', kind: 'error' });
      return;
    }
    setLoading(true);
    const body = {
      ...form,
      photo_urls: photos.map(p => p.url),
    };
    const res = editTarget
      ? await fetch(`/api/cleaning/${editTarget.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
      : await fetch('/api/cleaning', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ message: d.error ?? '保存に失敗しました', kind: 'error' });
      return;
    }
    closeForm();
    setToast({ message: editTarget ? '更新しました' : '清掃記録を追加しました', kind: 'success' });
    load();
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await fetch(`/api/cleaning/${deleteTarget.id}`, { method: 'DELETE' });
    setLoading(false);
    setDeleteTarget(null);
    if (!res.ok) { setToast({ message: '削除に失敗しました', kind: 'error' }); return; }
    setToast({ message: '削除しました', kind: 'success' });
    load();
  };

  const canSave = !!form.cleaned_date && !!form.person
    && (persons.length === 0 || !!form.personSelect)
    && !photos.some(p => p.uploading);

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {deleteTarget && (
        <ConfirmDialog
          title={`${formatDate(deleteTarget.date)}の記録を削除`}
          message="この清掃記録と写真を削除します。元に戻せません。"
          confirmLabel="削除する"
          onConfirm={remove}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ライトボックス */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="清掃写真"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">清掃記録</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">全 {logs.length} 件</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-700 shadow-sm text-base"
        >
          <Plus size={18} /> 記録を追加
        </button>
      </div>

      {/* 記録一覧 */}
      <div className="flex flex-col gap-3">
        {logs.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-10 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles size={26} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">清掃記録がありません</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-5">清掃した日付・担当者・写真を記録できます</p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-700"
            >
              <Plus size={15} /> 最初の記録を追加
            </button>
          </div>
        )}

        {logs.map(log => {
          const photoUrls = log.photo_urls ?? [];
          return (
            <div key={log.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* メイン情報 */}
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base whitespace-nowrap">
                        {formatDate(log.cleaned_date)}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full font-medium shrink-0">
                        {log.person}
                      </span>
                      {photoUrls.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <ImageIcon size={12} /> {photoUrls.length}枚
                        </span>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                        {log.notes}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                      登録: {log.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(log)}
                      className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Pencil size={14} /> 編集
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: log.id, date: log.cleaned_date })}
                      className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} /> 削除
                    </button>
                  </div>
                </div>

                {/* 写真サムネイル */}
                {photoUrls.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {photoUrls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setLightbox(url)}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400 transition-colors shrink-0"
                        title="クリックで拡大"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`清掃写真 ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 入力フォーム */}
      {showForm && (
        <Modal
          title={editTarget ? '清掃記録を編集' : '清掃記録を追加'}
          onClose={closeForm}
        >
          {/* 日付 */}
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              清掃した日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inputCls}
              value={form.cleaned_date}
              onChange={e => setForm({ ...form, cleaned_date: e.target.value })}
            />
          </div>

          {/* 担当者 */}
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              担当者 <span className="text-red-500">*</span>
            </label>
            {persons.length > 0 ? (
              <>
                <select
                  className="border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  style={{ fontSize: '16px' }}
                  value={form.personSelect}
                  onChange={e => {
                    const v = e.target.value;
                    setForm({ ...form, personSelect: v, person: v === '__other__' ? '' : v });
                  }}
                >
                  <option value="">選択してください</option>
                  {persons.map(name => <option key={name} value={name}>{name}</option>)}
                  <option value="__other__">その他（直接入力）</option>
                </select>
                {form.personSelect === '__other__' && (
                  <input
                    type="text"
                    className={`${inputCls} mt-2`}
                    value={form.person}
                    onChange={e => setForm({ ...form, person: e.target.value })}
                    placeholder="担当者名を入力"
                    autoFocus
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                className={inputCls}
                value={form.person}
                onChange={e => setForm({ ...form, person: e.target.value })}
                placeholder="例: 山田、業者A（設定で担当者を登録するとプルダウンになります）"
              />
            )}
          </div>

          {/* 特記事項 */}
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              特記事項（任意）
            </label>
            <textarea
              className="border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none"
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="例: 排水溝を清掃した、ゴミが多かった、次回は〇〇を確認する"
            />
          </div>

          {/* 写真添付 */}
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              写真（任意・最大5枚）
            </label>

            {/* 写真プレビュー */}
            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {photos.map((photo, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-600 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`写真 ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={20} className="text-white animate-spin" />
                      </div>
                    )}
                    {!photo.uploading && (
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 写真追加ボタン */}
            {photos.length < 5 && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 py-4 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                >
                  <Camera size={18} /> 写真を追加する
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-center">
                  JPEG・PNG・WebP・HEIC対応 / 1枚10MBまで
                </p>
              </>
            )}
          </div>

          {/* 保存ボタン */}
          <button
            onClick={save}
            disabled={!canSave || loading}
            className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-700 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> 保存中...</>
              : <><Check size={18} /> {editTarget ? '保存する' : '追加する'}</>
            }
          </button>
        </Modal>
      )}
    </div>
  );
}
