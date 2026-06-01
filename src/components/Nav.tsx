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
      {/* ══ ヘッダー ══ */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-0.5 shrink-0">
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">Park</span>
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-emerald-400">Ledger</span>
          </Link>

          {/* 右側ボタン群 */}
          <div className="flex items-center">
            {/* 設定 */}
            <Link
              href="/settings"
              className={`flex items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 sm:px-3 rounded-xl text-sm font-medium transition-colors
                ${pathname === '/settings'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Settings size={18} />
              <span className="hidden sm:inline text-sm">設定</span>
            </Link>

            {/* ログアウト — タップ領域を44×44px確保 */}
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 sm:px-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="ログアウト"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline text-sm">ログアウト</span>
            </button>
          </div>
        </div>

        {/* ══ タブレット・PC用ナビ ══ */}
        <nav className="hidden md:block border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4">
            <ul className="flex gap-1 py-1.5 flex-wrap">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${active
                          ? 'bg-white text-slate-900'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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

      {/* ══ スマホ用下部ナビ ══ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex flex-col items-center justify-center gap-0.5 w-full py-1.5 text-[10px] font-bold transition-colors
                    ${active ? 'text-slate-900' : 'text-slate-400'}`}
                  style={{ minHeight: '52px' }}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                  <span className="leading-tight text-center" style={{ fontSize: '9px' }}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* スマホ用の下部ナビ分スペース確保（safe-areaも含む） */}
      <div
        className="md:hidden"
        style={{ height: 'calc(52px + env(safe-area-inset-bottom))' }}
      />
    </>
  );
}
