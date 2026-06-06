'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, Car } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);

  // 設定画面で保存したログインIDを自動入力
  useEffect(() => {
    const saved = localStorage.getItem('saved_login_id');
    if (saved) setIdentifier(saved);
  }, []);
  const [error,      setError]      = useState(
    searchParams.get('error') === 'auth_callback' ? 'ログインリンクが無効または期限切れです' : ''
  );
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d.error === 'email_not_confirmed') {
        setError('メールアドレスの確認が完了していません。\n登録時に届いたメール内のリンクをクリックしてからログインしてください。');
      } else {
        setError(d.error ?? 'メールアドレスまたはパスワードが正しくありません');
      }
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div
      className="flex flex-col lg:flex-row"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        overflowY: 'auto',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ══ ブランド上部（モバイル）/ 左パネル（PC） ══ */}
      <div className="bg-slate-900 flex flex-col justify-center px-8 py-6 lg:w-1/2 lg:py-0 lg:px-16">
        {/* ロゴ */}
        <div className="flex items-center gap-4 mb-4 lg:mb-6">
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

        <h1 className="text-white text-2xl lg:text-4xl font-bold leading-snug mb-3">
          月極駐車場の管理を、<br />
          <span className="text-emerald-400">スマホ一台で。</span>
        </h1>
        <p className="hidden lg:block text-slate-400 text-base leading-relaxed lg:mb-10">
          入金・領収書・契約者情報をまとめて管理できます。
        </p>

        {/* セキュリティ表示（PCのみ） */}
        <div className="hidden lg:flex items-center gap-2 mt-10 text-slate-500 text-sm">
          <Shield size={14} className="text-emerald-500" />
          <span>SSL暗号化通信で保護されています</span>
        </div>
      </div>

      {/* ══ フォームセクション ══ */}
      <div
        className="flex-1 bg-white flex flex-col lg:w-1/2 lg:justify-center lg:items-center lg:px-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="w-full lg:max-w-[420px] px-6 py-10 lg:px-0">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">ログイン</h2>
          <p className="text-slate-500 text-base mb-8">IDまたはメールアドレスでログイン</p>

          <form onSubmit={login} className="flex flex-col gap-5">
            <div>
              <label className="text-base font-bold text-slate-700 block mb-2">
                メールアドレス または ID
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="例: yamada@example.com"
                className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label className="text-base font-bold text-slate-700 block mb-2">パスワード</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="w-full px-4 py-4 pr-14 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                  style={{ fontSize: '16px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center w-10 h-10"
                >
                  {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <div className="text-right -mt-2">
              <Link href="/reset-password" className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2">
                パスワードを忘れた方
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700 font-medium whitespace-pre-line">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors shadow-md"
              style={{ minHeight: '60px', fontSize: '18px' }}
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

          {/* フッター */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-base text-slate-500">
              はじめての方は{' '}
              <Link href="/register" className="text-emerald-600 font-bold hover:text-emerald-700 underline underline-offset-2">
                新規登録
              </Link>
            </p>
            <div className="flex items-center gap-3">
              <a href="/privacy" className="text-xs text-slate-400 hover:text-slate-600">プライバシー</a>
              <span className="text-slate-200">·</span>
              <a href="/terms" className="text-xs text-slate-400 hover:text-slate-600">規約</a>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2026 ParkLedger
          </p>
        </div>
      </div>
    </div>
  );
}
