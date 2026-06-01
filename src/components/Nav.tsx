'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Car, Users, CreditCard, MessageSquare, LogOut, Settings, Sparkles } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

const links = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/garages', label: '空き状況', icon: Car },
  { href: '/contractors', label: '契約者', icon: Users },
  { href: '/payments', label: '入金', icon: CreditCard },
  { href: '/inquiries', label: '問合せ', icon: MessageSquare },
  { href: '/cleaning', label: '清掃', icon: Sparkles },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  // ページ遷移のたびにリセット（ログイン後に誤表示されるバグ対策）
  useEffect(() => {
    setShowLogout(false);
  }, [pathname]);

  if (pathname === '/login' || pathname.startsWith('/print')) return null;

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* ══ ヘッダー（ノッチ・Dynamic Island対応） ══ */}
      <header
        className="bg-slate-900 text-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0.5 shrink-0">
            <span className="text-base sm:text-lg font-black tracking-tighter text-white">Park</span>
            <span className="text-base sm:text-lg font-black tracking-tighter text-emerald-400">Ledger</span>
          </Link>

          <div className="flex items-center gap-0.5">
            <Link
              href="/settings"
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors
                ${pathname === '/settings' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              aria-label="設定"
            >
              <Settings size={16} />
            </Link>
            <button
              onClick={() => setShowLogout(true)}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="ログアウト"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* PC用ナビ */}
        <nav className="hidden md:block border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4">
            <ul className="flex gap-0.5 py-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${active ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <Icon size={14} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* ══ iOS風 下部ナビ ══ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex h-16">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`relative flex flex-col items-center justify-center gap-[3px] w-full h-full transition-colors
                    ${active ? 'text-slate-900' : 'text-slate-500'}`}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-500" />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-[13px] font-medium leading-none">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {showLogout && (
        <ConfirmDialog
          title="ログアウト"
          message="ログアウトしますか？"
          confirmLabel="ログアウト"
          danger={false}
          onConfirm={logout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  );
}
