'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, UserPlus, Eye, EyeOff, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [done,         setDone]         = useState(false);

  const inputStyle = {
    fontSize: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
  };
  const focusStyle = { border: '1px solid rgba(52,211,153,0.35)', boxShadow: '0 0 0 3px rgba(52,211,153,0.08)' };
  const blurStyle  = { border: '1px solid rgba(255,255,255,0.10)', boxShadow: 'none' };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (password.length < 8)  { setError('パスワードは8文字以上にしてください'); return; }

    setLoading(true);
    setError('');

    const res = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ business_name: businessName, email, password }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? '登録に失敗しました');
      setLoading(false);
      return;
    }

    // 登録成功 → そのままサインイン
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // サインインに失敗しても登録自体は完了しているのでログインページへ案内
      router.push('/login');
      return;
    }

    setDone(true);
    setTimeout(() => { router.push('/'); router.refresh(); }, 1500);
  };

  const canSubmit = businessName.trim() && email && password.length >= 8 && password === confirm;

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
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
              style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)', boxShadow: '0 0 24px rgba(52,211,153,0.08)' }}>
              <UserPlus size={20} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-center gap-0.5 mb-1.5">
              <span className="text-2xl font-black tracking-tighter text-white">Park</span>
              <span className="text-2xl font-black tracking-tighter text-emerald-400">Ledger</span>
            </div>
            <p className="text-slate-500 text-sm">新規アカウント登録</p>
          </div>

          <div className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {done ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(52,211,153,0.15)' }}>
                  <Check size={28} className="text-emerald-400" />
                </div>
                <p className="text-white font-bold text-lg">登録完了！</p>
                <p className="text-slate-400 text-sm mt-1">ホーム画面に移動します…</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h1 className="text-white font-bold text-base">アカウントを作成</h1>
                  <p className="text-slate-500 text-sm mt-0.5">各項目を入力して登録してください</p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-3">
                  <input
                    type="text"
                    required
                    autoComplete="organization"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="事業者名（例: 山田駐車場）"
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)}
                  />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="メールアドレス"
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)}
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="パスワード（8文字以上）"
                      className="w-full px-4 py-3.5 pr-12 rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                      onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="パスワード（確認）"
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)}
                  />

                  {password && confirm && password !== confirm && (
                    <p className="text-sm text-red-400">パスワードが一致しません</p>
                  )}

                  {error && (
                    <div className="rounded-xl px-4 py-2.5"
                      style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                      <p className="text-sm text-red-400 font-medium leading-snug">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className="relative w-full text-white font-bold rounded-xl transition-all mt-1"
                    style={{
                      minHeight: '52px',
                      fontSize: '16px',
                      background: loading || !canSubmit
                        ? 'rgba(52,211,153,0.25)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      opacity: !canSubmit ? 0.5 : 1,
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
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

          <p className="text-center text-slate-500 text-sm mt-5">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              ログイン
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Shield size={12} className="text-slate-600" />
            <p className="text-slate-600 text-xs">SSL暗号化通信で保護されています</p>
          </div>
          <p className="text-center text-slate-700 text-xs mt-2">ParkLedger © 2026</p>
        </div>
      </div>
    </div>
  );
}
