'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, Check, Car, TrendingUp, FileText } from 'lucide-react';
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
        setError('メールアドレスの確認が完了していません。\n登録時に届いたメール内のリンクをクリックしてから再度お試しください。');
      } else {
        setError('メールアドレス（またはID）またはパスワードが正しくありません');
      }
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  const FEATURES = [
    { icon: TrendingUp, text: '入金状況をリアルタイムで管理' },
    { icon: FileText,   text: '領収書・書類をワンタップで発行' },
    { icon: Car,        text: '契約者・区画情報を一元管理' },
  ];

  return (
    <div
      className="min-h-[100dvh] bg-slate-900 flex flex-col lg:flex-row"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ══ ブランドセクション ══ */}
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-10 lg:py-16 lg:px-16">
        {/* ロゴ */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Car size={24} className="text-white" />
          </div>
          <div>
            <p className="text-white text-2xl font-black tracking-tight leading-none">
              Park<span className="text-emerald-400">Ledger</span>
            </p>
            <p className="text-slate-400 text-xs mt-0.5 tracking-widest">駐車場管理システム</p>
          </div>
        </div>

        <h1 className="text-white text-3xl lg:text-4xl font-bold leading-snug mb-3">
          月極駐車場の管理を、<br />
          <span className="text-emerald-400">もっとシンプルに。</span>
        </h1>
        <p className="text-slate-400 text-base mb-8 leading-relaxed">
          入金チェック・領収書発行・契約者管理を<br className="hidden lg:block" />
          スマートフォン一台で完結します。
        </p>

        {/* 機能一覧（デスクトップのみ） */}
        <div className="hidden lg:flex flex-col gap-3 mb-10">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-slate-300">
              <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={14} className="text-emerald-400" />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>

        {/* 信頼バッジ */}
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { icon: Shield, label: 'SSL暗号化通信' },
            { icon: Check,  label: 'データ分離管理' },
            { icon: Shield, label: '行レベルセキュリティ' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Icon size={12} className="text-emerald-500" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ══ フォームセクション ══ */}
      <div className="lg:w-1/2 flex items-center justify-center px-5 pb-10 lg:py-0">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* カードヘッダー */}
            <div className="bg-slate-50 border-b border-slate-100 px-7 py-5">
              <h2 className="text-xl font-bold text-slate-900">ログイン</h2>
              <p className="text-slate-500 text-sm mt-0.5">IDまたはメールアドレスでログイン</p>
            </div>

            {/* フォーム */}
            <form onSubmit={login} className="px-7 py-6 flex flex-col gap-4">
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
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
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
                    className="w-full px-4 py-3.5 pr-14 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
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

              <div className="text-right -mt-1">
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
                className="w-full bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors mt-1 shadow-sm"
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

            {/* フッター */}
            <div className="border-t border-slate-100 px-7 py-4 bg-slate-50 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                はじめての方は{' '}
                <Link href="/register" className="text-emerald-600 font-bold hover:text-emerald-700 underline underline-offset-2">
                  新規登録
                </Link>
              </p>
              <div className="flex items-center gap-2">
                <a href="/privacy" className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">プライバシー</a>
                <span className="text-slate-200">·</span>
                <a href="/terms" className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">利用規約</a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs mt-5">
            <Shield size={12} className="text-emerald-500" />
            <span>SSL暗号化通信で保護されています</span>
            <span className="text-slate-700 mx-1">·</span>
            <span>ParkLedger © 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
