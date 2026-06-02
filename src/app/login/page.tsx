'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState(
    searchParams.get('error') === 'auth_callback' ? 'ログインリンクが無効または期限切れです' : ''
  );
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let email = identifier.trim().toLowerCase();

    if (!email.includes('@')) {
      const res = await fetch('/api/auth/resolve-login-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: identifier.trim() }),
      });
      if (!res.ok) {
        setError('メールアドレスまたはIDが正しくありません');
        setLoading(false);
        return;
      }
      email = (await res.json()).email;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('メールアドレス（またはID）またはパスワードが正しくありません');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

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
            <Lock size={28} className="text-white" />
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">Park</span>
            <span className="text-3xl font-black tracking-tight text-emerald-600">Ledger</span>
          </div>
          <p className="text-slate-500 text-base">駐車場管理システム</p>
        </div>

        {/* カード */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h1 className="text-xl font-bold text-slate-900 mb-1">ログイン</h1>
          <p className="text-slate-500 text-sm mb-5">メールアドレスまたはIDでログインしてください</p>

          <form onSubmit={login} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                メールアドレスまたはID
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="例: yamada@example.com"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">パスワード</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="w-full px-4 py-3.5 pr-14 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  style={{ fontSize: '16px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center w-9 h-9"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              style={{ minHeight: '56px', fontSize: '17px' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  ログイン中...
                </span>
              ) : 'ログインする'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-base mt-6">
          はじめての方は{' '}
          <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-bold underline underline-offset-2">
            新規登録
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
