import type { Metadata, Viewport } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'ParkLedger – 駐車場管理',
  description: '月極駐車場の空き・契約・入金を一元管理',
  other: {
    // Supabase・Vercel への事前接続でログイン・API を高速化
    'link-preconnect-supabase': '',
  },
};

// iPhoneのノッチ・ホームバーに対応
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',   // ← ノッチ対応
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* Supabase への事前接続でログイン・API呼び出しを高速化 */}
        <link rel="preconnect" href="https://qklhushyorsjddryixdj.supabase.co" />
        <link rel="dns-prefetch" href="https://qklhushyorsjddryixdj.supabase.co" />
      </head>
      <body className="min-h-[100dvh] overflow-x-hidden">
        <Nav />
        {/* max-w-4xl: 支払い2列グリッドを許容しつつ他ページは各自で制御 */}
        <main className="page-main max-w-4xl mx-auto px-4 pt-4 md:px-6 md:pt-5 print:max-w-none print:p-0">
          {children}
        </main>
      </body>
    </html>
  );
}
