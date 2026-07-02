-- ================================================================
-- 督促履歴テーブル + ownerロール制限
-- Supabase Dashboard → SQL Editor → 貼り付けて Run
-- ================================================================

-- 督促ログテーブル（既存テーブルを変更しないので安全）
CREATE TABLE IF NOT EXISTS reminder_logs (
  id            SERIAL  PRIMARY KEY,
  org_id        UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contractor_id INTEGER NOT NULL REFERENCES contractors(id)   ON DELETE CASCADE,
  year_month    TEXT    NOT NULL,
  reminded_at   TEXT    NOT NULL,
  method        TEXT    NOT NULL DEFAULT 'other'
                  CHECK (method IN ('phone', 'email', 'other'))
);

ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminder_logs_rls" ON reminder_logs FOR ALL
  TO authenticated
  USING    (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

CREATE INDEX IF NOT EXISTS idx_reminder_logs_org ON reminder_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_cm  ON reminder_logs(contractor_id, year_month);

-- ================================================================
-- 完了！クロードに「SQL実行しました」と教えてください。
-- ================================================================
