import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error(
    '⛔ DATABASE_URL が設定されていません。\n' +
    '  1. https://neon.tech でデータベースを作成\n' +
    '  2. .env.local に DATABASE_URL=postgres://... を追加\n' +
    '  3. Vercel にも同じ値を設定'
  );
}

// sql はタグ付きテンプレートリテラル関数
// 例: await sql`SELECT * FROM garages WHERE id = ${id}`
// ${} に入れた値は自動的にパラメータ化される（SQLインジェクション防止）
export const sql = neon(process.env.DATABASE_URL);
