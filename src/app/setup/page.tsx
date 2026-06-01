'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Shield } from 'lucide-react';

export default function SetupPage() {
  const router  = useRouter();
  const [email,     setEmail]    = useState('');
  const [password,  setPassword] = useState('');
  const [confirm,   setConfirm]  = useState('');
  const [loading,   setLoading]  = useState(false);
  const [checking,  setChecking] = useState(true);
  const [error,     setError]    = useState('');
  const [done,      setDone]     = useState(false);

  // すでにユーザーが存在する場合はログイン画面へ
  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then(d => { if (d.hasUsers) router.replace('/login'); else setChecking(false); })
      .catch(() => setChecking(false));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (password.length < 8)  { setError('パスワードは8文字以上にしてください'); return; }

    setLoading(true);
    setError('');

    const res = await fetch('/api/setup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'セットアップに失敗しました');
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  };

  if (checking) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#080e20' }}>
      <svg className="animate-spin h-8 w-8 text-emerald-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ backgroundColor: '#080e20' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#0d1836] to-[#060c18]" />
      <div
        className="relative min-h-full flex flex-col items-center justify-center"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          paddingBottom: 'max(36px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))',
        }}
      >
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
              style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)' }}>
              <Lock size={20} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-center gap-0.5 mb-1.5">
              <span className="text-2xl font-black tracking-tighter text-white">Park</span>
              <span className="text-2xl font-black tracking-tighter text-emerald-400">Ledger</span>
            </div>
            <p className="text-slate-400 text-sm">初回セットアップ</p>
          </div>

          <div className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={28} className="text-emerald-400" />
                </div>
                <p className="text-white font-bold text-lg">アカウントを作成しました</p>
                <p className="text-slate-400 text-sm mt-1">ログイン画面へ移動します…</p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h1 className="text-white font-bold text-base">管理者アカウントの作成</h1>
                  <p className="text-slate-400 text-sm mt-1">ログインに使うメールアドレスとパスワードを設定してください</p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-3">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">メールアドレス</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 focus:outline-none"
                      style={{ fontSize: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">パスワード（8文字以上）</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 focus:outline-none"
                      style={{ fontSize: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-1.5">パスワード（確認）</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 focus:outline-none"
                      style={{ fontSize: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl px-4 py-2.5"
                      style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email || !password || !confirm}
                    className="w-full text-white font-bold rounded-xl py-3.5 mt-1 disabled:opacity-40 transition-all"
                    style={{ fontSize: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  >
                    {loading ? '作成中...' : 'アカウントを作成する'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-5">
            <Shield size={12} className="text-slate-600" />
            <p className="text-slate-600 text-xs">このページは初回のみ表示されます</p>
          </div>
        </div>
      </div>
    </div>
  );
}
