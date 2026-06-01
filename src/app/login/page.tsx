'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? 'ログインに失敗しました');
      setLoading(false);
    }
  };

  return (
    /*
      fixed inset-0 で viewport 全面を覆う。
      body の bg-slate-50 や safe-area padding の影響を受けない。
      overflow-y-auto でキーボード表示時にスクロール可能。
    */
    <div className="fixed inset-0 overflow-y-auto" style={{ backgroundColor: '#080e20' }}>

      {/* ── 背景グラデーション ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#0d1836] to-[#060c18]" />

      {/* 上部に淡いエメラルドのグロー */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[240px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, transparent 70%)' }}
      />

      {/* コンテンツ（safe-area対応・キーボード時にスクロール） */}
      <div
        className="relative min-h-full flex flex-col items-center justify-center"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          paddingBottom: 'max(36px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))',
        }}
      >
        <div className="w-full max-w-[360px]">

          {/* ── ロゴエリア ── */}
          <div className="text-center mb-7">
            {/* アイコンマーク */}
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-4"
              style={{
                background: 'rgba(52,211,153,0.10)',
                border: '1px solid rgba(52,211,153,0.20)',
                boxShadow: '0 0 24px rgba(52,211,153,0.08)',
              }}
            >
              <Lock size={19} className="text-emerald-400" />
            </div>

            {/* ロゴ */}
            <div className="flex items-center justify-center gap-0.5 mb-1.5">
              <span className="text-[22px] font-black tracking-tighter text-white">Park</span>
              <span className="text-[22px] font-black tracking-tighter text-emerald-400">Ledger</span>
            </div>
            <p className="text-slate-500 text-[13px]">駐車場管理システム</p>
          </div>

          {/* ── ガラスカード ── */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* カードヘッダー */}
            <div className="mb-4">
              <h1 className="text-white font-bold text-[15px]">管理者ログイン</h1>
              <p className="text-slate-500 text-[13px] mt-0.5">パスワードを入力してください</p>
            </div>

            <form onSubmit={login} className="flex flex-col gap-3">
              {/* パスワード入力 */}
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 transition-all focus:outline-none"
                style={{
                  fontSize: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
                onFocus={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.border = '1px solid rgba(52,211,153,0.35)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(52,211,153,0.08)';
                }}
                onBlur={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="パスワード"
                autoComplete="current-password"
              />

              {/* エラー表示 */}
              {error && (
                <div
                  className="rounded-xl px-4 py-2.5"
                  style={{
                    background: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(239,68,68,0.20)',
                  }}
                >
                  <p className="text-[13px] text-red-400 font-medium leading-snug">{error}</p>
                </div>
              )}

              {/* CTAボタン */}
              <button
                type="submit"
                disabled={loading || !password}
                className="relative w-full text-white font-bold rounded-xl transition-all"
                style={{
                  minHeight: '48px',
                  fontSize: '15px',
                  background: loading || !password
                    ? 'rgba(52,211,153,0.25)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: loading || !password
                    ? 'none'
                    : '0 4px 16px rgba(16,185,129,0.25), 0 1px 0 rgba(255,255,255,0.10) inset',
                  opacity: !password ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (!loading && password) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.35), 0 1px 0 rgba(255,255,255,0.10) inset';
                  }
                }}
                onMouseLeave={e => {
                  if (!loading && password) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(16,185,129,0.25), 0 1px 0 rgba(255,255,255,0.10) inset';
                  }
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    ログイン中...
                  </span>
                ) : 'ログインする'}
              </button>
            </form>
          </div>

          {/* セキュリティバッジ */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <Shield size={11} className="text-slate-600" />
            <p className="text-slate-600 text-[11px]">SSL暗号化通信で保護されています</p>
          </div>

          <p className="text-center text-slate-700 text-[11px] mt-2">ParkLedger © 2026</p>
        </div>
      </div>
    </div>
  );
}
