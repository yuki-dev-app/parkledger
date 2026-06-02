'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(
    searchParams.get('error') === 'auth_callback' ? 'ログインリンクが無効または期限切れです' : ''
  );
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('メールアドレスまたはパスワードが違います');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden" style={{ backgroundColor: '#080e20' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#0d1836] to-[#060c18]" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[240px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, transparent 70%)' }}
      />

      <div
        className="relative min-h-full flex flex-col items-center justify-center"
        style={{
          paddingTop:    'max(52px, env(safe-area-inset-top))',
          paddingBottom: 'max(36px, env(safe-area-inset-bottom))',
          paddingLeft:   'max(20px, env(safe-area-inset-left))',
          paddingRight:  'max(20px, env(safe-area-inset-right))',
        }}
      >
        <div className="w-full max-w-[360px]">

          {/* ロゴ */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
              style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)', boxShadow: '0 0 24px rgba(52,211,153,0.08)' }}>
              <Lock size={20} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-center gap-0.5 mb-1.5">
              <span className="text-2xl font-black tracking-tighter text-white">Park</span>
              <span className="text-2xl font-black tracking-tighter text-emerald-400">Ledger</span>
            </div>
            <p className="text-slate-500 text-sm">駐車場管理システム</p>
          </div>

          {/* カード */}
          <div className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="mb-4">
              <h1 className="text-white font-bold text-base">管理者ログイン</h1>
              <p className="text-slate-500 text-sm mt-0.5">メールアドレスとパスワードを入力してください</p>
            </div>

            <form onSubmit={login} className="flex flex-col gap-3">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="メールアドレス"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all"
                style={{ fontSize: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(52,211,153,0.35)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(52,211,153,0.08)'; }}
                onBlur={e  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="パスワード"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all"
                style={{ fontSize: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(52,211,153,0.35)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(52,211,153,0.08)'; }}
                onBlur={e  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)'; e.currentTarget.style.boxShadow = 'none'; }}
              />

              {error && (
                <div className="rounded-xl px-4 py-2.5"
                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                  <p className="text-sm text-red-400 font-medium leading-snug">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="relative w-full text-white font-bold rounded-xl transition-all"
                style={{
                  minHeight: '52px',
                  fontSize: '16px',
                  background: loading || !email || !password
                    ? 'rgba(52,211,153,0.25)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  opacity: (!email || !password) ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
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

          <div className="flex items-center justify-center gap-1.5 mt-5">
            <Shield size={12} className="text-slate-600" />
            <p className="text-slate-600 text-xs">SSL暗号化通信で保護されています</p>
          </div>
          <p className="text-center text-slate-700 text-xs mt-2">ParkLedger © 2026</p>
        </div>
      </div>
    </div>
  );
}
