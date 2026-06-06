'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Check, Eye, EyeOff, RefreshCw, Mail } from 'lucide-react';
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
  const [resent,   setResent]   = useState(false);

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

    setDone(true);
  };

  const resendEmail = async () => {
    const supabase = createClient();
    await supabase.auth.resend({ type: 'signup', email });
    setResent(true);
    setTimeout(() => setResent(false), 5000);
  };

  const canSubmit = email && password.length >= 8 && password === confirm;

  return (
    <div
      className="flex flex-col"
      style={{
        position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
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
        <h1 className="text-white text-2xl font-bold leading-snug">
          新規アカウント登録
        </h1>
        <p className="text-slate-400 text-base mt-2">
          メールアドレスとパスワードを設定してください。
        </p>
      </div>

      {/* 下部ホワイト */}
      <div className="flex-1 bg-white">
        <div className="w-full px-6 py-10">
          {done ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={36} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-3">確認メールを送りました</p>
              <p className="text-slate-600 text-base leading-relaxed mb-1">
                <strong>{email}</strong> に確認メールを送りました。
              </p>
              <p className="text-slate-600 text-base mb-6">
                メール内のリンクをクリックするとログインできます。
              </p>
              <p className="text-sm text-slate-400 mb-6">
                届かない場合は迷惑メールフォルダをご確認ください
              </p>
              <button
                type="button"
                onClick={resendEmail}
                disabled={resent}
                className="w-full flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-600 py-4 rounded-xl text-base font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} />
                {resent ? '送信しました' : '確認メールを再送する'}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <label className="text-base font-bold text-slate-700 block mb-2">メールアドレス</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="例: yamada@example.com"
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="text-base font-bold text-slate-700 block mb-2">パスワード（8文字以上）</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    className="w-full px-4 py-4 pr-14 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                    style={{ fontSize: '16px' }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center w-10 h-10">
                    {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-base font-bold text-slate-700 block mb-2">パスワード（確認）</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="もう一度入力"
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                  style={{ fontSize: '16px' }}
                />
                {password && confirm && password !== confirm && (
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
                disabled={loading || !canSubmit}
                className="w-full bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors shadow-md"
                style={{ minHeight: '60px', fontSize: '18px' }}
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

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <p className="text-base text-slate-500">
                  すでにアカウントをお持ちの方は{' '}
                  <Link href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 underline underline-offset-2">
                    ログイン
                  </Link>
                </p>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-slate-400 mt-8">© 2026 ParkLedger</p>
        </div>
      </div>
    </div>
  );
}
