'use client';
import { useState } from 'react';
import { Car, ArrowLeft, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('正しいメールアドレスを入力してください');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password/confirm`,
    });

    setLoading(false);
    if (err) {
      console.error('reset password error:', err.message);
    }
    setSent(true);
  };

  return (
    <div
      className="flex flex-col"
      style={{
        position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* 上部ダーク */}
      <div className="bg-slate-900 px-8 py-10">
        <div className="flex items-center gap-4 mb-6">
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
        <h1 className="text-white text-2xl font-bold leading-snug">
          パスワードを<br />お忘れの方へ
        </h1>
        <p className="text-slate-400 text-base mt-2">
          登録済みのメールアドレスに再設定リンクをお送りします。
        </p>
      </div>

      {/* 下部ホワイト */}
      <div className="flex-1 bg-white">
        <div className="w-full px-6 py-10">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={36} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-3">メールを送信しました</p>
              <p className="text-slate-600 text-base leading-relaxed mb-2">
                入力されたメールアドレスに<br />パスワード再設定用のリンクを送りました。
              </p>
              <p className="text-sm text-slate-400 mb-8">
                届かない場合は迷惑メールフォルダをご確認ください
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-slate-600 font-medium text-base underline underline-offset-2"
              >
                <ArrowLeft size={16} /> ログイン画面に戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <label className="text-base font-bold text-slate-700 block mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="例: yamada@example.com"
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors shadow-md"
                style={{ minHeight: '60px', fontSize: '18px' }}
              >
                {loading ? '送信中...' : '再設定メールを送る'}
              </button>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-slate-500 font-medium text-base hover:text-slate-700"
                >
                  <ArrowLeft size={16} /> ログイン画面に戻る
                </Link>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-slate-400 mt-10">© 2026 ParkLedger</p>
        </div>
      </div>
    </div>
  );
}
