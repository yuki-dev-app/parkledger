-- ================================================================
-- ParkLedger Supabase Schema
-- 招待制マルチテナントSaaS対応 + RLS完全設定
--
-- Supabase → SQL Editor → このSQL全体を貼り付けて Run
-- ================================================================

-- ================================================================
-- テーブル定義
-- ================================================================

-- 駐車場事業者（テナント単位）
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT '新規事業者',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ユーザーと事業者の紐付け
CREATE TABLE IF NOT EXISTS org_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- 駐車区画
CREATE TABLE IF NOT EXISTS garages (
  id          SERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  number      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'vacant'
                CHECK (status IN ('vacant','occupied','maintenance')),
  monthly_fee INTEGER NOT NULL DEFAULT 0,
  notes       TEXT NOT NULL DEFAULT '',
  UNIQUE(number, org_id)
);

-- 契約者
CREATE TABLE IF NOT EXISTS contractors (
  id                SERIAL PRIMARY KEY,
  org_id            UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  garage_id         INTEGER NOT NULL REFERENCES garages(id),
  name              TEXT    NOT NULL,
  phone             TEXT    NOT NULL DEFAULT '',
  email             TEXT    NOT NULL DEFAULT '',
  address           TEXT    NOT NULL DEFAULT '',
  vehicle_type      TEXT    NOT NULL DEFAULT '',
  vehicle_number    TEXT    NOT NULL DEFAULT '',
  vehicle_chassis   TEXT    NOT NULL DEFAULT '',
  emergency_contact TEXT    NOT NULL DEFAULT '',
  contract_start    TEXT    NOT NULL,
  contract_end      TEXT    NOT NULL DEFAULT '',
  notes             TEXT    NOT NULL DEFAULT '',
  archived_at       TEXT    NOT NULL DEFAULT '',
  archive_reason    TEXT    NOT NULL DEFAULT ''
);

-- 入金記録
CREATE TABLE IF NOT EXISTS payments (
  id            SERIAL  PRIMARY KEY,
  org_id        UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contractor_id INTEGER NOT NULL REFERENCES contractors(id),
  year_month    TEXT    NOT NULL,
  amount        INTEGER NOT NULL,
  paid_date     TEXT    NOT NULL DEFAULT '',
  status        TEXT    NOT NULL DEFAULT 'unpaid'
                  CHECK (status IN ('paid','unpaid','late')),
  notes         TEXT    NOT NULL DEFAULT '',
  UNIQUE(contractor_id, year_month)
);

-- 問い合わせ
CREATE TABLE IF NOT EXISTS inquiries (
  id         SERIAL PRIMARY KEY,
  org_id     UUID   NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT   NOT NULL,
  phone      TEXT   NOT NULL DEFAULT '',
  email      TEXT   NOT NULL DEFAULT '',
  message    TEXT   NOT NULL,
  status     TEXT   NOT NULL DEFAULT 'new'
               CHECK (status IN ('new','in_progress','resolved')),
  created_at TEXT   NOT NULL DEFAULT '',
  notes      TEXT   NOT NULL DEFAULT ''
);

-- 設定（キーバリュー、テナントごと）
CREATE TABLE IF NOT EXISTS settings (
  id     SERIAL  PRIMARY KEY,
  org_id UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key    TEXT    NOT NULL,
  value  TEXT    NOT NULL DEFAULT '',
  UNIQUE(org_id, key)
);

-- 清掃記録
CREATE TABLE IF NOT EXISTS cleaning_logs (
  id           SERIAL PRIMARY KEY,
  org_id       UUID   NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cleaned_date TEXT   NOT NULL,
  person       TEXT   NOT NULL,
  notes        TEXT   NOT NULL DEFAULT '',
  created_at   TEXT   NOT NULL DEFAULT ''
);

-- ================================================================
-- インデックス
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_garages_org      ON garages(org_id);
CREATE INDEX IF NOT EXISTS idx_contractors_org  ON contractors(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_org     ON payments(org_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_org    ON inquiries(org_id);
CREATE INDEX IF NOT EXISTS idx_settings_org     ON settings(org_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_org     ON cleaning_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_uid  ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_oid  ON org_members(org_id);

-- ================================================================
-- RLS（Row Level Security）有効化
-- ================================================================
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE garages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_logs  ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- ヘルパー関数
-- ================================================================

-- 現在のユーザーが所属するorg_idを返す
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 現在のユーザーがシステム管理者かどうか
-- ⚠️ user_metadata はユーザー自身が書き換え可能なため app_metadata を参照すること
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;

-- ================================================================
-- RLS ポリシー：organizations
-- ================================================================

-- 自分の事業者のみ閲覧可（管理者は全て）
CREATE POLICY "organizations_select" ON organizations FOR SELECT
  TO authenticated
  USING (
    is_system_admin() OR
    id = get_my_org_id()
  );

-- 管理者のみ作成・更新・削除
CREATE POLICY "organizations_insert" ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (is_system_admin());

CREATE POLICY "organizations_update" ON organizations FOR UPDATE
  TO authenticated
  USING (is_system_admin() OR id = get_my_org_id())
  WITH CHECK (is_system_admin() OR id = get_my_org_id());

CREATE POLICY "organizations_delete" ON organizations FOR DELETE
  TO authenticated
  USING (is_system_admin());

-- ================================================================
-- RLS ポリシー：org_members
-- ================================================================
CREATE POLICY "members_select" ON org_members FOR SELECT
  TO authenticated
  USING (
    is_system_admin() OR
    org_id = get_my_org_id() OR
    user_id = auth.uid()
  );

CREATE POLICY "members_admin_write" ON org_members FOR ALL
  TO authenticated
  USING (is_system_admin())
  WITH CHECK (is_system_admin());

-- ================================================================
-- RLS ポリシー：データテーブル（自分の事業者のみ CRUD 可）
-- ================================================================

-- garages
CREATE POLICY "garages_rls" ON garages FOR ALL
  TO authenticated
  USING    (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- contractors
CREATE POLICY "contractors_rls" ON contractors FOR ALL
  TO authenticated
  USING    (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- payments
CREATE POLICY "payments_rls" ON payments FOR ALL
  TO authenticated
  USING    (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- inquiries
CREATE POLICY "inquiries_rls" ON inquiries FOR ALL
  TO authenticated
  USING    (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- settings
CREATE POLICY "settings_rls" ON settings FOR ALL
  TO authenticated
  USING    (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- cleaning_logs
CREATE POLICY "cleaning_rls" ON cleaning_logs FOR ALL
  TO authenticated
  USING    (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- ================================================================
-- トリガー：招待を承諾したユーザーを自動でorg_membersに追加
-- ================================================================
CREATE OR REPLACE FUNCTION handle_invited_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_role   TEXT;
BEGIN
  -- メタデータからorg_idとroleを取得
  v_org_id := (NEW.raw_user_meta_data->>'org_id')::uuid;
  v_role   := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');

  IF v_org_id IS NOT NULL THEN
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (v_org_id, NEW.id, v_role)
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- メール確認完了時（招待承諾 or 通常確認）に発火
CREATE OR REPLACE TRIGGER on_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_invited_user();

-- 管理者が直接作成したユーザー（confirmed済み）にも対応
CREATE OR REPLACE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_invited_user();

-- ================================================================
-- 完了！次のステップ：
-- 1. Supabase Dashboard → Authentication → Settings で
--    「Site URL」を https://parkledger.vercel.app に設定
-- 2. 「Redirect URLs」に https://parkledger.vercel.app/auth/callback を追加
-- 3. クロードに「Supabase SQL実行しました」と教えてください
-- ================================================================
