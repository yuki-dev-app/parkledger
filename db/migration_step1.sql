-- ================================================================
-- ParkLedger マルチテナント移行 Step 1
-- ================================================================
-- このSQLを Neon（https://console.neon.tech）の SQL Editor で
-- 実行してください。既存データは一切削除されません。安全です。
--
-- 実行方法：
--   1. https://console.neon.tech を開く
--   2. 左メニューから「SQL Editor」をクリック
--   3. このSQL全体をコピーして貼り付けて「Run」を押す
--   4. エラーが出なければ完了（成功メッセージが出ます）
-- ================================================================

-- ① アカウント（ログインユーザー）テーブルを新規作成
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  is_active     BOOLEAN DEFAULT true
);

-- ② 全テーブルに owner_id を追加（NULL許容で既存データを守る）
ALTER TABLE garages       ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
ALTER TABLE contractors   ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
ALTER TABLE payments      ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
ALTER TABLE inquiries     ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
ALTER TABLE settings      ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
ALTER TABLE cleaning_logs ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);

-- ③ 検索パフォーマンス用インデックスを作成
CREATE INDEX IF NOT EXISTS idx_garages_owner      ON garages(owner_id);
CREATE INDEX IF NOT EXISTS idx_contractors_owner  ON contractors(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner     ON payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_owner    ON inquiries(owner_id);
CREATE INDEX IF NOT EXISTS idx_settings_owner     ON settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_owner     ON cleaning_logs(owner_id);

-- ④ 区画番号の重複制限を削除
--    （複数テナントが同じ番号（例:「1番」）を使えるようにする）
ALTER TABLE garages DROP CONSTRAINT IF EXISTS garages_number_key;

-- ================================================================
-- 完了！ここまで実行できたらクロードに「SQL実行しました」と
-- 教えてください。次のステップに進みます。
-- ================================================================
