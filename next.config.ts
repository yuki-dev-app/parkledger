import type { NextConfig } from "next";

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
  // ⚠️ Supabase・Vercel のドメインを許可リストに追加している
  // ⚠️ 'unsafe-inline' はスタイルのためのみ許可（Tailwind CSS が必要）
  //    将来的に nonce ベースに移行推奨
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Supabase API（認証・DB）
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
      // スクリプト: 'unsafe-inline' と 'unsafe-eval' は Next.js が必要
      // TODO: nonce ベースに移行することで unsafe-inline を削除できる
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // スタイル: Tailwind + インラインスタイルのために unsafe-inline が必要
      "style-src 'self' 'unsafe-inline'",
      // 画像: data: URI（アイコン等）も許可
      "img-src 'self' data: blob: https://*.supabase.co",
      // フォント
      "font-src 'self'",
      // フレーム: 完全禁止
      "frame-src 'none'",
      // フォーム送信先: 同一オリジンのみ
      "form-action 'self'",
      // base タグの制限
      "base-uri 'self'",
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
