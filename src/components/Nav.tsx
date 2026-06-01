'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Car, Users, CreditCard, MessageSquare, LogOut, Settings, Sparkles } from 'lucide-react';

const links = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/garages', label: '空き状況', icon: Car },
  { href: '/contractors', label: '契約者', icon: Users },
  { href: '/payments', label: '入金', icon: CreditCard },
  { href: '/inquiries', label: '問い合わせ', icon: MessageSquare },
  { href: '/cleaning', label: '清掃記録', icon: Sparkles },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login' || pathname.startsWith('/print')) return null;

  const logout = async () => {
    if (!confirm('ログアウトしますか？')) return;
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* ヘッダー */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-white">Park</span>
            <span className="text-2xl font-black tracking-tighter text-emerald-400">Ledger</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/settings"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${pathname === '/settings' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Settings size={16} />
              <span className="hidden sm:inline">設定</span>
            </Link>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <LogOut size={16} />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>

        {/* タブレット・PC用ナビ */}
        <nav className="hidden md:block border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4">
            <ul className="flex gap-1 py-1.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link href={href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${active
                          ? 'bg-white text-slate-900'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                      <Icon size={16} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* スマホ用下部ナビ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <ul className="flex justify-around">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={href} className="flex-1">
                <Link href={href}
                  className={`flex flex-col items-center gap-1 pt-2.5 pb-3 text-xs font-bold transition-colors
                    ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="md:hidden h-[68px]" />
    </>
  );
}
