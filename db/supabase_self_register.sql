-- ================================================================
-- ParkLedger 自己登録対応 SQL
-- ================================================================
-- Supabase SQL Editor で実行してください。
-- 既存のデータは削除されません。
-- ================================================================

-- 既存トリガー・関数を置き換え
DROP TRIGGER IF EXISTS on_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_user_created   ON auth.users;
DROP FUNCTION IF EXISTS handle_invited_user();

-- 招待フロー・自己登録フローの両方に対応した新しい関数
CREATE OR REPLACE FUNCTION handle_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_role   TEXT;
BEGIN
  v_org_id := (NEW.raw_user_meta_data->>'org_id')::uuid;
  v_role   := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');

  IF v_org_id IS NOT NULL THEN
    -- 招待フロー：既存の組織にメンバーとして追加
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (v_org_id, NEW.id, v_role)
    ON CONFLICT (org_id, user_id) DO NOTHING;

  ELSE
    -- 自己登録フロー：新しい組織を自動作成してオーナーになる
    INSERT INTO public.organizations (name)
    VALUES (
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'business_name', ''),
        '新規事業者'
      )
    )
    RETURNING id INTO v_org_id;

    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (v_org_id, NEW.id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- メール確認完了時（招待承諾 or 自己登録確認）に発火
CREATE OR REPLACE TRIGGER on_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_user_confirmed();

-- 管理者が直接 confirmed 状態で作成したユーザーにも対応
CREATE OR REPLACE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_user_confirmed();

-- ================================================================
-- 完了！クロードに「SQL実行しました」と教えてください。
-- ================================================================
