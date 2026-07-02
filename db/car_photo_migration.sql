-- ================================================================
-- 写真URL カラム追加マイグレーション
-- Supabase Dashboard → SQL Editor → 貼り付けて Run
-- ================================================================

-- 契約者の車・書類写真URLの配列カラム
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS car_photo_urls TEXT[] NOT NULL DEFAULT '{}';

-- 清掃記録の写真URLの配列カラム
ALTER TABLE cleaning_logs
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] NOT NULL DEFAULT '{}';

-- ================================================================
-- 完了！これで写真アップロード機能が正式に使えるようになります。
-- ================================================================
