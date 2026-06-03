'use client';
import { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
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
      // エラーの詳細を返さない（メールアドレス列挙防止）
      console.error('reset password error:', err.message);
    }
    // 成功・失敗にかかわらず同じメッセージを表示（列挙防止）
    setSent(true);
  };

  return (
    <div
      className="h-[100dvh] overflow-hidden bg-slate-100 flex flex-col"
      style={{
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ヘッダー帯 */}
      <div className="bg-slate-800 text-white text-center py-4 shrink-0">
        <p className="text-xs tracking-widest text-slate-300 mb-0.5">PARK LEDGER</p>
        <p className="text-lg font-bold tracking-wide">駐車場管理システム</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h1 className="text-xl font-bold text-slate-900">パスワードを忘れた方</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                登録済みのメールアドレスを入力してください
              </p>
            </div>

            {sent ? (
              <div className="px-6 py-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={28} className="text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 mb-2">
                  メールを送信しました
                </p>
                <p className="text-slate-600 text-base leading-relaxed">
                  入力されたメールアドレスに<br />
                  パスワード再設定用のリンクを<br />
                  送信しました。
                </p>
                <p className="text-sm text-slate-400 mt-3">
                  ※ 届かない場合は迷惑メールフォルダをご確認ください
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-block text-slate-600 underline underline-offset-2 text-sm"
                >
                  ログイン画面に戻る
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">
                    メールアドレス
                  </label>
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

                {error && (
                  <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                  style={{ minHeight: '54px', fontSize: '17px' }}
                >
                  {loading ? '送信中...' : '再設定メールを送る'}
                </button>
              </form>
            )}
          </div>

          <div className="text-center mt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-base font-medium"
            >
              <ArrowLeft size={16} />
              ログイン画面に戻る
            </Link>
          </div>
        </div>
      </div>

      <div className="shrink-0 pb-4 text-center text-xs text-slate-400">
        <Shield size={12} className="inline mr-1" />
        SSL暗号化通信で保護されています · ParkLedger © 2026
      </div>
    </div>
  );
}
