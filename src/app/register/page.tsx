'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Check, Eye, EyeOff } from 'lucide-react';
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

    // メール確認必須のため、登録後は確認メール待ち画面を表示
    setDone(true);
  };

  const canSubmit = email && password.length >= 8 && password === confirm;

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
              <h1 className="text-xl font-bold text-slate-900">新規アカウント登録</h1>
              <p className="text-slate-500 text-sm mt-0.5">メールアドレスとパスワードを入力してください</p>
            </div>

            {done ? (
              <div className="px-6 py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 border-2 border-slate-300">
                  <Check size={32} className="text-slate-700" />
                </div>
                <p className="text-xl font-bold text-slate-900">確認メールを送りました</p>
                <p className="text-slate-600 text-base mt-2 leading-relaxed">
                  <strong>{email}</strong> に<br />確認メールを送りました。
                </p>
                <p className="text-slate-600 text-base mt-2">
                  メール内のリンクをクリックすると<br />ログインできるようになります。
                </p>
                <p className="text-sm text-slate-400 mt-3">
                  ※ 届かない場合は迷惑メールをご確認ください
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3.5">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">メールアドレス</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="例: yamada@example.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-600 transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">パスワード（8文字以上）</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="パスワードを入力"
                      className="w-full px-4 py-3 pr-14 rounded-xl border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-600 transition-colors"
                      style={{ fontSize: '16px' }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center w-10 h-10">
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">パスワード（確認）</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="パスワードを再入力"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-600 transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                  {password && confirm && password !== confirm && (
                    <p className="text-sm text-red-600 mt-1.5 font-medium">パスワードが一致しません</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors mt-1"
                  style={{ minHeight: '54px', fontSize: '17px' }}
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
              </form>
            )}
          </div>

          {/* ログインリンク */}
          <p className="text-center text-slate-600 text-base mt-4">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-slate-800 hover:text-slate-900 font-bold underline underline-offset-2">
              ログインはこちら
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
