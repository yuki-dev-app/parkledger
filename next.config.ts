import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  // クリックジャッキング防止
  { key: 'X-Frame-Options', value: 'DENY' },
  // MIMEスニッフィング防止
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // リファラー情報の漏洩を最小化
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 不要なブラウザ機能を無効化
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS: HTTPS を強制（本番のみ。開発では無効にしたい場合は max-age=0）
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // コンテンツセキュリティポリシー（XSS 被害の最小化）
  // ⚠️ Supabase のドメインを許可リストに追加している
  // ⚠️ script-src の 'unsafe-inline' は Next.js のインラインスクリプトに必要。
  //    完全な nonce ベース CSP は全ページの動的レンダリング化が必要なため見送り
  //    （node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md 参照）。
  //    'unsafe-eval' は開発時の React デバッグ用のみで、本番では付与しない。
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Supabase API（認証・DB）
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
      // スクリプト: 'unsafe-eval' は開発環境のみ（本番の React/Next.js は eval 不要）
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      // スタイル: Tailwind + インラインスタイルのために unsafe-inline が必要
      "style-src 'self' 'unsafe-inline'",
      // 画像: data: URI（アイコン等）も許可
      "img-src 'self' data: blob: https://*.supabase.co",
      // フォント
      "font-src 'self'",
      // フレーム: 完全禁止
      "frame-src 'none'",
      // このサイトを iframe に埋め込むことを禁止（X-Frame-Options の CSP 版）
      "frame-ancestors 'none'",
      // <object> / <embed> 禁止
      "object-src 'none'",
      // フォーム送信先: 同一オリジンのみ
      "form-action 'self'",
      // base タグの制限
      "base-uri 'self'",
      // 本番では http:// への混在リクエストを https:// に強制
      ...(isDev ? [] : ['upgrade-insecure-requests']),
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
