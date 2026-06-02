'use client';
/**
 * 初回ログイン時のパスワード設定ページ
 * 招待メールから来たユーザーがここでパスワードを設定する
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, KeyRound, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router   = useRouter();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (password.length < 8)  { setError('パスワードは8文字以上にしてください'); return; }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden" style={{ backgroundColor: '#080e20' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#0d1836] to-[#060c18]" />

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
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <KeyRound size={24} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-center gap-0.5 mb-2">
              <span className="text-2xl font-black tracking-tighter text-white">Park</span>
              <span className="text-2xl font-black tracking-tighter text-emerald-400">Ledger</span>
            </div>
            <p className="text-white font-bold text-lg mt-2">パスワードを設定してください</p>
            <p className="text-slate-400 text-sm mt-1">このパスワードで毎回ログインします</p>
          </div>

          <div className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <form onSubmit={submit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="新しいパスワード（8文字以上）"
                  className="w-full px-4 py-3.5 pr-12 rounded-xl text-white placeholder-slate-600 focus:outline-none"
                  style={{ fontSize: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
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
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-600 focus:outline-none"
                style={{ fontSize: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              />

              {password && confirm && password !== confirm && (
                <p className="text-sm text-red-400">パスワードが一致しません</p>
              )}
              {password.length > 0 && password.length < 8 && (
                <p className="text-sm text-red-400">8文字以上にしてください（今 {password.length} 文字）</p>
              )}

              {error && (
                <div className="rounded-xl px-4 py-2.5"
                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || password.length < 8 || password !== confirm}
                className="w-full font-bold rounded-xl py-4 text-white mt-1 disabled:opacity-40"
                style={{
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                }}
              >
                {loading ? '設定中...' : (
                  <span className="flex items-center justify-center gap-2">
                    <Check size={18} /> パスワードを設定して始める
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
