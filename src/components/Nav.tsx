'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Car, Users, CreditCard, MessageSquare, LogOut, Settings, Sparkles, BarChart2, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ConfirmDialog from '@/components/ConfirmDialog';

const BOTTOM_NAV = [
  { href: '/',            label: 'ホーム',   icon: Home },
  { href: '/contractors', label: '契約者',   icon: Users },
  { href: '/payments',    label: '入金',     icon: CreditCard },
  { href: '/cleaning',    label: '清掃',     icon: Sparkles },
  { href: '/inquiries',   label: '問合せ',   icon: MessageSquare },
];

const TOP_NAV = [
  { href: '/',            label: 'ホーム',     icon: Home },
  { href: '/garages',     label: '空き状況',   icon: Car },
  { href: '/contractors', label: '契約者',     icon: Users },
  { href: '/payments',    label: '入金',       icon: CreditCard },
  { href: '/analytics',   label: '年間分析',   icon: BarChart2 },
  { href: '/inquiries',   label: '問い合わせ', icon: MessageSquare },
  { href: '/cleaning',    label: '清掃',       icon: Sparkles },
  { href: '/help',        label: 'ヘルプ',     icon: HelpCircle },
];

export default function Nav() {
  const pathname   = usePathname();
  const router     = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => { setShowLogout(false); }, [pathname]);

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/privacy' ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/print') ||
    pathname.startsWith('/setup') ||
    pathname.startsWith('/auth')
  ) return null;

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* ══ ヘッダー ══ */}
      <header
        className="bg-slate-900 text-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0.5 shrink-0">
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">Park</span>
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-emerald-400">Ledger</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                pathname === '/settings' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">設定</span>
            </Link>
            <button
              onClick={() => setShowLogout(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>

        {/* PC用ナビ */}
        <nav className="hidden md:block border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-5">
            <ul className="flex gap-1 py-1.5">
              {TOP_NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* ══ スマホ下部ナビ ══ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex h-[68px]">
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={href} className="flex-1 relative">
                <Link
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                    active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {active && (
                    <span className="absolute" style={{ top: 0, width: '40px', height: '3px', backgroundColor: '#059669', borderRadius: '0 0 3px 3px' }} />
                  )}
                  <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
                  <span className={`text-xs font-medium leading-none ${active ? 'font-bold' : ''}`} style={{ fontSize: '13px' }}>{label}</span>
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
