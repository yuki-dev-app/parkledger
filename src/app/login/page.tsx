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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 mb-3">
            <span className="text-4xl font-black tracking-tighter text-white">Park</span>
            <span className="text-4xl font-black tracking-tighter text-emerald-400">Ledger</span>
          </div>
          <p className="text-slate-400 text-base">駐車場管理システム</p>
        </div>

        {/* フォームカード */}
        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-100 rounded-xl w-11 h-11 flex items-center justify-center">
              <Lock size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">管理者ログイン</p>
              <p className="text-sm text-slate-500">パスワードを入力してください</p>
            </div>
          </div>

          <form onSubmit={login} className="flex flex-col gap-4">
            <input
              type="password"
              className="border-2 border-slate-200 rounded-xl px-4 py-4 w-full text-xl focus:outline-none focus:border-slate-700 tracking-widest bg-slate-50"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="bg-slate-900 text-white py-4 rounded-xl text-lg font-bold hover:bg-slate-700 active:bg-black disabled:opacity-50 transition-colors shadow"
            >
              {loading ? 'ログイン中...' : 'ログインする'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">ParkLedger © 2026</p>
      </div>
    </div>
  );
}
