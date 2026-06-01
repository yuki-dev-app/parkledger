'use client';
import { useEffect, useState, useCallback } from 'react';
import { Check, Settings as SettingsIcon, Plus, X, Users, Building2, FileText, Car, UserPlus, Trash2, Eye, EyeOff } from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

type UserRow = { id: number; email: string; created_at: string; is_active: boolean };

type Settings = {
  business_name: string;
  business_address: string;
  business_phone: string;
  parking_name: string;
  parking_address: string;
  receipt_no_prefix: string;
  cleaning_persons: string;
};

const inputCls = 'border border-slate-300 rounded-xl px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-slate-700 bg-white text-sm';

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({
    business_name: '', business_address: '', business_phone: '',
    parking_name: '', parking_address: '', receipt_no_prefix: 'R',
    cleaning_persons: '',
  });
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState<ToastType | null>(null);
  const [newPerson, setNewPerson] = useState('');

  // アカウント設定
  const [currentUserId,    setCurrentUserId]    = useState(0);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [users,           setUsers]           = useState<UserRow[]>([]);
  const [newEmail,        setNewEmail]        = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [addingUser,       setAddingUser]       = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserRow | null>(null);

  // メール変更
  const [myNewEmail,     setMyNewEmail]     = useState('');
  const [savingEmail,    setSavingEmail]    = useState(false);

  // パスワード変更
  const [currentPass,    setCurrentPass]    = useState('');
  const [newPass,        setNewPass]        = useState('');
  const [confirmPass,    setConfirmPass]    = useState('');
  const [showCurrent,    setShowCurrent]    = useState(false);
  const [showNew,        setShowNew]        = useState(false);
  const [savingPass,     setSavingPass]     = useState(false);

  const load = useCallback(async () => {
    const [sRes, uRes, meRes] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/users'),
      fetch('/api/me'),
    ]);
    setForm(await sRes.json());
    setUsers(await uRes.json());
    const me = await meRes.json().catch(() => null);
    if (me?.id) {
      setCurrentUserId(me.id);
      setCurrentUserEmail(me.email ?? '');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const persons = form.cleaning_persons
    ? form.cleaning_persons.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const save = async () => {
    setLoading(true);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setToast({ message: res.ok ? '保存しました' : '保存に失敗しました', kind: res.ok ? 'success' : 'error' });
  };

  const addPerson = async () => {
    const name = newPerson.trim();
    if (!name || persons.includes(name)) return;
    const updated = [...persons, name].join(',');
    setForm(f => ({ ...f, cleaning_persons: updated }));
    setNewPerson('');
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleaning_persons: updated }),
    });
    setToast({ message: `${name} を追加しました`, kind: 'success' });
  };

  const changeEmail = async () => {
    if (!myNewEmail) return;
    setSavingEmail(true);
    const res = await fetch('/api/me/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: myNewEmail }),
    });
    setSavingEmail(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ message: d.error ?? 'メールアドレスの変更に失敗しました', kind: 'error' });
      return;
    }
    setCurrentUserEmail(myNewEmail);
    setMyNewEmail('');
    setToast({ message: 'メールアドレスを変更しました', kind: 'success' });
    load();
  };

  const changePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) return;
    if (newPass !== confirmPass) {
      setToast({ message: '新しいパスワードが一致しません', kind: 'error' });
      return;
    }
    setSavingPass(true);
    const res = await fetch('/api/me/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPass, new_password: newPass }),
    });
    setSavingPass(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ message: d.error ?? 'パスワードの変更に失敗しました', kind: 'error' });
      return;
    }
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setToast({ message: 'パスワードを変更しました', kind: 'success' });
  };

  const addUser = async () => {
    if (!newEmail || !newPassword) return;
    setAddingUser(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword }),
    });
    setAddingUser(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ message: d.error ?? 'ユーザーの追加に失敗しました', kind: 'error' });
      return;
    }
    setNewEmail('');
    setNewPassword('');
    setToast({ message: `${newEmail} を追加しました`, kind: 'success' });
    load();
  };

  const removeUser = async () => {
    if (!deleteUserTarget) return;
    const res = await fetch(`/api/users/${deleteUserTarget.id}`, { method: 'DELETE' });
    setDeleteUserTarget(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setToast({ message: d.error ?? '削除に失敗しました', kind: 'error' });
      return;
    }
    setToast({ message: `${deleteUserTarget.email} を削除しました`, kind: 'success' });
    load();
  };

  const removePerson = async (name: string) => {
    const updated = persons.filter(p => p !== name).join(',');
    setForm(f => ({ ...f, cleaning_persons: updated }));
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleaning_persons: updated }),
    });
    setToast({ message: `${name} を削除しました`, kind: 'success' });
  };

  return (
    <div className="max-w-xl mx-auto pb-24">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-slate-800 text-white rounded-xl w-9 h-9 flex items-center justify-center shrink-0">
          <SettingsIcon size={17} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">設定</h1>
          <p className="text-xs text-slate-400">領収書・書類・清掃担当者の設定</p>
        </div>
      </div>

      {/* ── 事業者情報 ── */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Building2 size={16} className="text-slate-600" />
          <h2 className="text-base font-bold text-slate-700">事業者情報</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {[
            { key: 'business_name', label: '事業者名・氏名', placeholder: '山田 太郎' },
            { key: 'business_address', label: '事業者の住所', placeholder: '〇〇県〇〇市〇〇町1-2-3' },
            { key: 'business_phone', label: '電話番号', placeholder: '090-0000-0000' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="px-4 py-3.5">
              <label className="text-sm font-medium text-slate-600 block mb-1.5">{label}</label>
              <input
                className={inputCls}
                value={(form as Record<string, string>)[key] ?? ''}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 駐車場情報 ── */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Car size={16} className="text-slate-600" />
          <h2 className="text-base font-bold text-slate-700">駐車場情報</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {[
            { key: 'parking_name', label: '駐車場の名称', placeholder: '〇〇パーキング', hint: '督促文・領収書に使用されます' },
            { key: 'parking_address', label: '駐車場の所在地', placeholder: '〇〇県〇〇市〇〇町4-5', hint: '車庫証明の「保管場所の位置」に印刷されます' },
          ].map(({ key, label, placeholder, hint }) => (
            <div key={key} className="px-4 py-3.5">
              <label className="text-sm font-medium text-slate-600 block mb-1.5">{label}</label>
              <input
                className={inputCls}
                value={(form as Record<string, string>)[key] ?? ''}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
              />
              {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── 書類設定 ── */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <FileText size={16} className="text-slate-600" />
          <h2 className="text-base font-bold text-slate-700">書類設定</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3.5">
            <label className="text-sm font-medium text-slate-600 block mb-1.5">領収書番号のプレフィックス</label>
            <input
              className={inputCls}
              value={form.receipt_no_prefix ?? 'R'}
              onChange={e => setForm({ ...form, receipt_no_prefix: e.target.value })}
              placeholder="R（例: R0001）"
            />
            <p className="text-xs text-slate-400 mt-1.5">領収書番号の先頭に付く文字です（例: R → R0001）</p>
          </div>
        </div>
      </section>

      {/* ── 清掃担当者 ── */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Users size={16} className="text-slate-600" />
          <h2 className="text-base font-bold text-slate-700">清掃担当者リスト</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-400 mb-3">清掃記録の入力時にプルダウンで選択できます</p>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
            {persons.length === 0 && (
              <p className="text-xs text-slate-400">担当者が登録されていません</p>
            )}
            {persons.map(name => (
              <span key={name} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">
                {name}
                <button onClick={() => removePerson(name)} className="text-slate-400 hover:text-red-500 flex items-center">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={inputCls + ' flex-1'}
              value={newPerson}
              onChange={e => setNewPerson(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPerson(); }}
              placeholder="例: 田中、業者A"
            />
            <button
              onClick={addPerson}
              disabled={!newPerson.trim()}
              className="flex items-center gap-1 bg-slate-800 text-white px-3.5 py-2 rounded-xl font-medium text-sm hover:bg-slate-700 disabled:opacity-40 shrink-0"
            >
              <Plus size={14} /> 追加
            </button>
          </div>
        </div>
      </section>

      {/* ── アカウント設定 ── */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Users size={16} className="text-slate-600" />
          <h2 className="text-base font-bold text-slate-700">アカウント設定</h2>
        </div>

        {/* メールアドレス変更 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-3">
          <div className="px-4 py-3.5 border-b border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-0.5">現在のメールアドレス</p>
            <p className="text-base font-bold text-slate-800">{currentUserEmail || '—'}</p>
          </div>
          <div className="px-4 py-3.5">
            <label className="text-sm font-medium text-slate-600 block mb-1.5">新しいメールアドレス</label>
            <input
              type="email"
              className={inputCls}
              value={myNewEmail}
              onChange={e => setMyNewEmail(e.target.value)}
              placeholder="new@example.com"
            />
            <button
              onClick={changeEmail}
              disabled={savingEmail || !myNewEmail || !myNewEmail.includes('@')}
              className="mt-2.5 w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 active:bg-slate-900 disabled:opacity-40"
            >
              <Check size={15} /> {savingEmail ? '変更中...' : 'メールアドレスを変更する'}
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3.5 flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-600">パスワードを変更する</label>

            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                className={inputCls + ' pr-12'}
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                placeholder="現在のパスワード"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrent(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <Eye size={16} />
              </button>
            </div>

            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className={inputCls + ' pr-12'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="新しいパスワード（8文字以上）"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <Eye size={16} />
              </button>
            </div>

            <input
              type={showNew ? 'text' : 'password'}
              className={inputCls}
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="新しいパスワード（確認）"
              autoComplete="new-password"
            />
            {newPass && confirmPass && newPass !== confirmPass && (
              <p className="text-xs text-red-500">パスワードが一致しません</p>
            )}
            {newPass.length > 0 && newPass.length < 8 && (
              <p className="text-xs text-red-500">パスワードは8文字以上にしてください（今 {newPass.length} 文字）</p>
            )}

            <button
              onClick={changePassword}
              disabled={savingPass || !currentPass || newPass.length < 8 || newPass !== confirmPass}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 active:bg-slate-900 disabled:opacity-40"
            >
              <Check size={15} /> {savingPass ? '変更中...' : 'パスワードを変更する'}
            </button>
          </div>
        </div>
      </section>

      {/* ── ユーザー管理 ── */}
      {deleteUserTarget && (
        <ConfirmDialog
          title={`${deleteUserTarget.email} を削除`}
          message="このアカウントを削除します。そのユーザーの駐車場データは残ります。この操作は元に戻せません。"
          confirmLabel="削除する"
          onConfirm={removeUser}
          onCancel={() => setDeleteUserTarget(null)}
        />
      )}

      <section className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <UserPlus size={16} className="text-slate-600" />
          <h2 className="text-base font-bold text-slate-700">ユーザー管理</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-400 mb-3">
            駐車場オーナーごとにアカウントを作成できます。それぞれのデータは完全に分離されます。
          </p>

          {/* 現在のユーザー一覧 */}
          <div className="flex flex-col gap-2 mb-4">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.email}</p>
                    {u.id === currentUserId && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold shrink-0">
                        あなた
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    登録日：{u.created_at?.slice(0, 10) ?? '—'}
                  </p>
                </div>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => setDeleteUserTarget(u)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 shrink-0"
                  >
                    <Trash2 size={14} /> 削除
                  </button>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-slate-400">ユーザーが登録されていません</p>
            )}
          </div>

          {/* 新規ユーザー追加フォーム */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">新しいユーザーを追加</p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                className={inputCls}
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="メールアドレス（例: tanaka@example.com）"
              />
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={inputCls + ' pr-12'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="パスワード（8文字以上）"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                onClick={addUser}
                disabled={addingUser || !newEmail || newPassword.length < 8}
                className="flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40"
              >
                <UserPlus size={16} />
                {addingUser ? '追加中...' : 'ユーザーを追加する'}
              </button>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-red-500">パスワードは8文字以上にしてください（今 {newPassword.length} 文字）</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 車庫証明の注意事項 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-4">
        <p className="text-xs font-bold text-amber-800 mb-1.5">車庫証明について（補足）</p>
        <ul className="text-[11px] text-amber-700 space-y-1 list-disc list-inside leading-relaxed">
          <li>型式・原動機型式が必要な場合は、印刷後に手書きで追記してください</li>
          <li>各都道府県警察の公式様式と合わせてご利用ください</li>
          <li>発行者の印鑑を押してから提出してください</li>
        </ul>
      </div>

      {/* 保存ボタン：スマホではボトムナビ上に固定。PCは通常配置。 */}
      <div className="save-bar bg-white/95 backdrop-blur-md border-t border-slate-200 p-3">
        <div className="max-w-xl mx-auto">
          <button
            onClick={save}
            disabled={loading}
            className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50 shadow-sm"
            style={{ fontSize: '16px' }}
          >
            <Check size={18} /> {loading ? '保存中...' : '事業者・書類情報を保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
