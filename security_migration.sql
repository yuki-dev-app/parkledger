-- ================================================================
-- セキュリティ強化マイグレーション
-- Supabase Dashboard → SQL Editor → 貼り付けて Run
-- ================================================================

-- ── 1) 写真バケットを非公開化 ────────────────────────────────
-- これまで公開バケットだったため、URLを知っていれば誰でも
-- 車・書類・清掃写真を閲覧できた。非公開化し、アプリ側は
-- 有効期限付きの署名URL（1時間）で表示する方式に変更済み。
UPDATE storage.buckets
   SET public = false
 WHERE id IN ('contractor-photos', 'cleaning-photos');

-- ── 2) ログインIDを小文字に統一 ──────────────────────────────
-- ログイン時は小文字で照合されるため、大文字入りで保存された
-- IDはログインできなかった。既存データを小文字に変換する。
-- ※ 万一 'Foo' と 'foo' のような重複が既に存在する場合、
--    次の 3) のインデックス作成が失敗するので、その際は
--    どちらかの login_id を NULL にしてから再実行してください。
UPDATE org_members
   SET login_id = lower(login_id)
 WHERE login_id IS NOT NULL
   AND login_id <> lower(login_id);

-- ── 3) 大文字小文字を区別しないユニークインデックスに置き換え ──
DROP INDEX IF EXISTS org_members_login_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS org_members_login_id_lower_key
  ON org_members (lower(login_id))
  WHERE login_id IS NOT NULL;

-- ================================================================
-- 完了！クロードに「SQL実行しました」と教えてください。
-- ================================================================
