-- ================================================================
-- login_id カラム追加マイグレーション
-- ================================================================
-- すでに supabase_schema.sql を実行済みの場合はこちらを実行してください。
-- Supabase Dashboard → SQL Editor → 貼り付けて Run
-- ================================================================

ALTER TABLE org_members ADD COLUMN IF NOT EXISTS login_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS org_members_login_id_key
  ON org_members (login_id)
  WHERE login_id IS NOT NULL;

-- ================================================================
-- 完了！クロードに「SQL実行しました」と教えてください。
-- ================================================================
