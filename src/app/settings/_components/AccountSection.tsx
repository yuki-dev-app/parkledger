'use client';
import { useState } from 'react';
import { Check, Eye, EyeOff, Mail, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ToastType } from '@/components/Toast';
import { inputCls } from '@/lib/styles';

// Supabaseのエラーメッセージを日本語に変換
function toJaError(msg: string): string {
  const map: Record<string, string> = {
    'Email rate limit exceeded':                    'メール送信の上限に達しました。しばらく待ってから再試行してください。',
    'User not found':                               'ユーザーが見つかりません。',
    'Invalid email':                                'メールアドレスの形式が正しくありません。',
    'Password should be at least 6 characters':     'パスワードは6文字以上にしてください。',
    'New password should be different from the old password': '新しいパスワードは現在のパスワードと異なるものにしてください。',
    'Invalid login credentials':                    'パスワードが正しくありません。',
  };
  return map[msg] ?? 'エラーが発生しました。時間をおいて再試行してください。';
}

type Props = {
  loginId:      string;
  currentEmail: string;
  onToast:      (t: ToastType) => void;
  onLoginIdSaved: (id: string) => void;
};

/**
 * アカウント設定セクション
 * ログインID変更・メール変更・パスワード変更を担当
 */
export default function AccountSection({ loginId, currentEmail, onToast, onLoginIdSaved }: Props) {
  const [newLoginId,  setNewLoginId]  = useState('');
  const [savingId,    setSavingId]    = useState(false);
  const [newEmail,      setNewEmail]      = useState('');
  const [emailPass,     setEmailPass]     = useState('');
  const [savingEmail,   setSavingEmail]   = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCur,     setShowCur]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [savingPass,  setSavingPass]  = useState(false);

  const saveLoginId = async () => {
    setSavingId(true);
    const res = await fetch('/api/me/login-id', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: newLoginId }),
    });
    setSavingId(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      onToast({ message: d.error ?? '更新に失敗しました', kind: 'error' });
      return;
    }
    // ログイン画面で自動入力できるよう端末に保存
    localStorage.setItem('saved_login_id', newLoginId);
    onLoginIdSaved(newLoginId);
    setNewLoginId('');
    onToast({ message: 'ログインIDを設定しました', kind: 'success' });
  };

  const changeEmail = async () => {
    if (!newEmail || !newEmail.includes('@') || !emailPass) return;
    setSavingEmail(true);
    const supabase = createClient();
    // セッション奪取によるアカウント乗っ取りを防ぐため、メール変更前に現在のパスワードで再認証
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentEmail, password: emailPass });
    if (signInError) {
      setSavingEmail(false);
      onToast({ message: '現在のパスワードが違います', kind: 'error' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSavingEmail(false);
    if (error) { onToast({ message: toJaError(error.message), kind: 'error' }); return; }
    setNewEmail('');
    setEmailPass('');
    onToast({ message: '確認メールを送りました。新しいメールアドレスを確認してください。', kind: 'success' });
  };

  const changePassword = async () => {
    if (!currentPass || !newPass || newPass !== confirmPass || newPass.length < 8) return;
    setSavingPass(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentEmail, password: currentPass });
    if (signInError) {
      setSavingPass(false);
      onToast({ message: '現在のパスワードが違います', kind: 'error' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSavingPass(false);
    if (error) { onToast({ message: toJaError(error.message), kind: 'error' }); return; }
    setCurrentPass(''); setNewPass(''); setConfirmPass('');
    onToast({ message: 'パスワードを変更しました', kind: 'success' });
  };

  return (
    <section className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <KeyRound size={16} className="text-slate-600 dark:text-slate-400" />
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">アカウント設定</h2>
      </div>

      {/* ログインID */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-3">
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">現在のログインID</p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">{loginId || '（未設定）'}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">メールアドレスの代わりにこのIDでログインできます</p>
        </div>
        <div className="px-4 py-3.5">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1.5">新しいログインID</label>
          <input
            className={inputCls}
            value={newLoginId}
            onChange={e => setNewLoginId(e.target.value)}
            placeholder="例: yamada123（半角英数字・ハイフン・_、3〜30文字）"
          />
          <button
            type="button"
            onClick={saveLoginId}
            disabled={savingId || !newLoginId.trim()}
            className="mt-2.5 w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40"
          >
            <Check size={15} />{savingId ? '保存中...' : 'ログインIDを設定する'}
          </button>
        </div>
      </div>

      {/* メール変更 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-3">
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">現在のメールアドレス</p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">{currentEmail || '—'}</p>
        </div>
        <div className="px-4 py-3.5">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1.5">新しいメールアドレス</label>
          <input type="email" className={inputCls} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" />
          <label className="text-sm font-medium text-slate-600 block mb-1.5 mt-3">現在のパスワード（確認）</label>
          <input type="password" className={inputCls} value={emailPass} onChange={e => setEmailPass(e.target.value)} placeholder="現在のパスワードを入力" autoComplete="current-password" />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">変更するとSupabaseから確認メールが送られます</p>
          <button
            type="button"
            onClick={changeEmail}
            disabled={savingEmail || !newEmail || !newEmail.includes('@') || !emailPass}
            className="mt-2.5 w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40"
          >
            <Mail size={15} />{savingEmail ? '送信中...' : '確認メールを送って変更する'}
          </button>
        </div>
      </div>

      {/* パスワード変更 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-4 py-3.5 flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">パスワードを変更する</label>
          <div className="relative">
            <input type={showCur ? 'text' : 'password'} className={`${inputCls} pr-12`} value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="現在のパスワード" autoComplete="current-password" />
            <button type="button" onClick={() => setShowCur(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} className={`${inputCls} pr-12`} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="新しいパスワード（8文字以上）" autoComplete="new-password" />
            <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <input type={showNew ? 'text' : 'password'} className={inputCls} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="新しいパスワード（確認）" autoComplete="new-password" />
          {newPass && confirmPass && newPass !== confirmPass && <p className="text-xs text-red-500">パスワードが一致しません</p>}
          {newPass.length > 0 && newPass.length < 8 && <p className="text-xs text-red-500">8文字以上にしてください（今{newPass.length}文字）</p>}
          <button
            type="button"
            onClick={changePassword}
            disabled={savingPass || !currentPass || newPass.length < 8 || newPass !== confirmPass}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40"
          >
            <Check size={15} />{savingPass ? '変更中...' : 'パスワードを変更する'}
          </button>
        </div>
      </div>
    </section>
  );
}
