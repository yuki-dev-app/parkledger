'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Eye, EyeOff, Car } from 'lucide-react';
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

  const outerStyle = {
    position: 'fixed' as const, inset: 0, zIndex: 50, overflowY: 'auto' as const,
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
  };

  if (!validToken) {
    return (
      <div className="flex flex-col" style={outerStyle}>
        <div className="bg-slate-900 px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Car size={28} className="text-white" />
            </div>
            <p className="text-white text-3xl font-black tracking-tight">
              Park<span className="text-emerald-400">Ledger</span>
            </p>
          </div>
        </div>
        <div className="flex-1 bg-white flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xl font-bold text-slate-900 mb-2">リンクを確認中...</p>
            <p className="text-slate-500 text-base">しばらくお待ちください</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={outerStyle}>
      {/* 上部ダーク */}
      <div className="bg-slate-900 px-8 py-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Car size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white text-3xl font-black tracking-tight leading-none">
              Park<span className="text-emerald-400">Ledger</span>
            </p>
            <p className="text-slate-400 text-sm mt-1 tracking-widest">駐車場管理システム</p>
          </div>
        </div>
        <h1 className="text-white text-2xl font-bold">新しいパスワードを設定</h1>
        <p className="text-slate-400 text-base mt-2">8文字以上のパスワードを入力してください。</p>
      </div>

      {/* 下部ホワイト */}
      <div className="flex-1 bg-white px-6 py-10">
        <div className="max-w-[420px]">
          {done ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={36} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-2">変更完了しました</p>
              <p className="text-slate-500 text-base">ログイン画面に移動します…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <label className="text-base font-bold text-slate-700 block mb-2">
                  新しいパスワード（8文字以上）
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="新しいパスワード"
                    className="w-full px-4 py-4 pr-14 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                    style={{ fontSize: '16px' }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center w-10 h-10">
                    {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-base font-bold text-slate-700 block mb-2">
                  パスワード（確認）
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="もう一度入力"
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                  style={{ fontSize: '16px' }}
                  autoComplete="new-password"
                />
                {newPass && confirmPass && newPass !== confirmPass && (
                  <p className="text-sm text-red-600 mt-2 font-medium">パスワードが一致しません</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || newPass.length < 8 || newPass !== confirmPass}
                className="w-full bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors shadow-md"
                style={{ minHeight: '60px', fontSize: '18px' }}
              >
                <Check size={20} /> {loading ? '変更中...' : 'パスワードを変更する'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-slate-400 mt-10">© 2026 ParkLedger</p>
        </div>
      </div>
    </div>
  );
}
