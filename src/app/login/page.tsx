'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff } from 'lucide-react';
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
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setError('メールアドレスの確認が完了していません。登録時に届いたメール内のリンクをクリックしてください。\n届いていない場合は迷惑メールフォルダをご確認ください。');
      } else {
        setError('メールアドレス（またはID）またはパスワードが正しくありません');
      }
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div
      className="h-[100dvh] overflow-hidden bg-slate-100 flex flex-col"
      style={{
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft:   'env(safe-area-inset-left)',
        paddingRight:  'env(safe-area-inset-right)',
      }}
    >
      {/* ヘッダー帯 */}
      <div className="bg-slate-800 text-white text-center py-4 shrink-0">
        <p className="text-xs tracking-widest text-slate-300 mb-0.5">PARK LEDGER</p>
        <p className="text-lg font-bold tracking-wide">駐車場管理システム</p>
      </div>

      {/* メインカード */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            {/* カードヘッダー */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h1 className="text-xl font-bold text-slate-900">ログイン</h1>
              <p className="text-slate-500 text-sm mt-0.5">IDまたはメールアドレスでログインしてください</p>
            </div>

            {/* フォーム */}
            <form onSubmit={login} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">
                  メールアドレス または ID
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="例: yamada@example.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-600 transition-colors"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">パスワード</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    className="w-full px-4 py-3 pr-14 rounded-xl border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-600 transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center w-10 h-10"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="text-right -mt-2">
                <Link href="/reset-password" className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2">
                  パスワードを忘れた方
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !identifier || !password}
                className="w-full bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                style={{ minHeight: '54px', fontSize: '17px' }}
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

          {/* 新規登録リンク */}
          <p className="text-center text-slate-600 text-base mt-4">
            はじめての方は{' '}
            <Link href="/register" className="text-slate-800 hover:text-slate-900 font-bold underline underline-offset-2">
              新規登録はこちら
            </Link>
          </p>
        </div>
      </div>

      {/* フッター */}
      <div className="shrink-0 pb-4 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
          <Shield size={12} />
          <span>SSL暗号化通信で保護されています</span>
          <span className="mx-1">·</span>
          <span>ParkLedger © 2026</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
          <a href="/privacy" className="hover:text-slate-600 underline underline-offset-2">プライバシーポリシー</a>
        </div>
      </div>
    </div>
  );
}
