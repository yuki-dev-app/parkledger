import type { Metadata, Viewport } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'ParkLedger – 駐車場管理',
  description: '月極駐車場の空き・契約・入金を一元管理',
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
      <body className="bg-slate-50 min-h-dvh overflow-x-hidden">
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-5 md:px-8 print:max-w-none print:p-0">
          {children}
        </main>
      </body>
    </html>
  );
}
