'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

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
    <div
      className="min-h-dvh bg-slate-900 flex items-center justify-center"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
      }}
    >
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-0.5 mb-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tighter text-white">Park</span>
            <span className="text-3xl sm:text-4xl font-black tracking-tighter text-emerald-400">Ledger</span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base">駐車場管理システム</p>
        </div>

        {/* フォームカード */}
        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-slate-100 rounded-xl w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-slate-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">管理者ログイン</p>
              <p className="text-xs sm:text-sm text-slate-500">パスワードを入力してください</p>
            </div>
          </div>

          <form onSubmit={login} className="flex flex-col gap-3">
            <input
              type="password"
              className="border-2 border-slate-200 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:border-slate-700 bg-slate-50"
              style={{ fontSize: '16px' }}   /* iOSズーム防止 */
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="パスワード"
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600 font-medium leading-snug">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="bg-slate-900 text-white rounded-xl text-base font-bold hover:bg-slate-700 active:bg-black disabled:opacity-50 transition-colors shadow"
              style={{ minHeight: '52px' }}
            >
              {loading ? 'ログイン中...' : 'ログインする'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5">ParkLedger © 2026</p>
      </div>
    </div>
  );
}
