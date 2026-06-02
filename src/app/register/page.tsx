'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Shield, Check, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (password.length < 8)  { setError('パスワードは8文字以上にしてください'); return; }

    setLoading(true);
    setError('');

    const res = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? '登録に失敗しました');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { router.push('/login'); return; }

    setDone(true);
    setTimeout(() => { router.push('/'); router.refresh(); }, 1500);
  };

  const canSubmit = email && password.length >= 8 && password === confirm;

  return (
    <div
      className="min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-slate-50 flex flex-col items-center justify-center"
      style={{
        paddingTop:    'max(40px, env(safe-area-inset-top))',
        paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
        paddingLeft:   'max(20px, env(safe-area-inset-left))',
        paddingRight:  'max(20px, env(safe-area-inset-right))',
      }}
    >
      <div className="w-full max-w-[400px]">

        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-5 shadow-lg">
            <UserPlus size={28} className="text-white" />
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">Park</span>
            <span className="text-3xl font-black tracking-tight text-emerald-600">Ledger</span>
          </div>
          <p className="text-slate-500 text-base">新規アカウント登録</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">登録完了！</p>
              <p className="text-slate-500 text-base mt-1">ホーム画面に移動します…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">アカウントを作成</h1>
              <p className="text-slate-500 text-sm mb-5">メールアドレスとパスワードを入力してください</p>

              <form onSubmit={submit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">メールアドレス</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="例: yamada@example.com"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">パスワード（8文字以上）</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="パスワードを入力"
                      className="w-full px-4 py-3.5 pr-14 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      style={{ fontSize: '16px' }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center w-9 h-9">
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">パスワード（確認）</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="パスワードを再入力"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    style={{ fontSize: '16px' }}
                  />
                  {password && confirm && password !== confirm && (
                    <p className="text-sm text-red-600 mt-1.5">パスワードが一致しません</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors mt-1"
                  style={{ minHeight: '56px', fontSize: '17px' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      登録中...
                    </span>
                  ) : '登録する'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-base mt-6">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold underline underline-offset-2">
            ログイン
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 mt-5">
          <Shield size={14} className="text-slate-400" />
          <p className="text-slate-400 text-sm">SSL暗号化通信で保護されています</p>
        </div>
        <p className="text-center text-slate-400 text-sm mt-1">ParkLedger © 2026</p>
      </div>
    </div>
  );
}
