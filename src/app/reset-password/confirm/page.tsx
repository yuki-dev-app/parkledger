'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Eye, EyeOff, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);
  const [validToken,  setValidToken]  = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Bug3修正: subscriptionをクリーンアップしてメモリリークを防ぐ
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidToken(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) { setError('パスワードは8文字以上にしてください'); return; }
    if (newPass !== confirmPass) { setError('パスワードが一致しません'); return; }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPass });

    setLoading(false);
    if (err) {
      setError('パスワードの変更に失敗しました。再度やり直してください。');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  };

  if (!validToken) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center px-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md p-8 max-w-sm w-full text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">リンクを確認中...</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">しばらくお待ちください</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] overflow-hidden bg-slate-100 dark:bg-slate-900 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-slate-800 text-white text-center py-4 shrink-0">
        <p className="text-xs tracking-widest text-slate-300 mb-0.5">PARK LEDGER</p>
        <p className="text-lg font-bold tracking-wide">駐車場管理システム</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-[400px]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 px-6 py-4">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">新しいパスワードを設定</h1>
            </div>

            {done ? (
              <div className="px-6 py-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">変更完了しました</p>
                <p className="text-slate-500 dark:text-slate-400 text-base mt-1">ログイン画面に移動します…</p>
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    新しいパスワード（8文字以上）
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      placeholder="新しいパスワード"
                      className="w-full px-4 py-3 pr-14 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                      style={{ fontSize: '16px' }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    確認（もう一度入力）
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    placeholder="パスワードを再入力"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                    style={{ fontSize: '16px' }}
                    autoComplete="new-password"
                  />
                  {newPass && confirmPass && newPass !== confirmPass && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 font-medium">パスワードが一致しません</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || newPass.length < 8 || newPass !== confirmPass}
                  className="w-full bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ minHeight: '54px', fontSize: '17px' }}
                >
                  <Check size={18} /> {loading ? '変更中...' : 'パスワードを変更する'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 pb-4 text-center text-xs text-slate-400">
        <Shield size={12} className="inline mr-1" />
        SSL暗号化通信で保護されています · ParkLedger © 2026
      </div>
    </div>
  );
}
