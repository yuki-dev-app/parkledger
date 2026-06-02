import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_ibMHm8fqOvu7@ep-gentle-field-aoxekcin.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

const [p, cl, inq, c, g] = await Promise.all([
  sql`SELECT COUNT(*) AS n FROM payments`,
  sql`SELECT COUNT(*) AS n FROM cleaning_logs`,
  sql`SELECT COUNT(*) AS n FROM inquiries`,
  sql`SELECT COUNT(*) AS n FROM contractors`,
  sql`SELECT COUNT(*) AS n FROM garages`,
]);
console.log(`削除前: 入金${p[0].n}件 清掃${cl[0].n}件 問い合わせ${inq[0].n}件 契約者${c[0].n}名 区画${g[0].n}区画`);

await sql`DELETE FROM payments`;
await sql`DELETE FROM cleaning_logs`;
await sql`DELETE FROM inquiries`;
await sql`DELETE FROM contractors`;
await sql`DELETE FROM garages`;

const [g2] = await Promise.all([sql`SELECT COUNT(*) AS n FROM garages`]);
console.log(`削除後: 区画${g2[0].n}区画 → 全データ削除完了`);
