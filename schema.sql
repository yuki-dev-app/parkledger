-- ParkLedger PostgreSQL スキーマ
-- Neon のSQL エディタで一度だけ実行してください

CREATE TABLE IF NOT EXISTS garages (
  id            SERIAL PRIMARY KEY,
  number        TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'vacant'
                  CHECK(status IN ('vacant','occupied','maintenance')),
  monthly_fee   INTEGER NOT NULL DEFAULT 0,
  notes         TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS contractors (
  id                SERIAL PRIMARY KEY,
  garage_id         INTEGER NOT NULL REFERENCES garages(id),
  name              TEXT NOT NULL,
  phone             TEXT DEFAULT '',
  email             TEXT DEFAULT '',
  address           TEXT DEFAULT '',
  vehicle_type      TEXT DEFAULT '',
  vehicle_number    TEXT DEFAULT '',
  vehicle_chassis   TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  contract_start    TEXT NOT NULL,
  contract_end      TEXT DEFAULT '',
  notes             TEXT DEFAULT '',
  archived_at       TEXT DEFAULT '',
  archive_reason    TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS payments (
  id             SERIAL PRIMARY KEY,
  contractor_id  INTEGER NOT NULL REFERENCES contractors(id),
  year_month     TEXT NOT NULL,
  amount         INTEGER NOT NULL,
  paid_date      TEXT DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'unpaid'
                   CHECK(status IN ('paid','unpaid','late')),
  notes          TEXT DEFAULT '',
  UNIQUE(contractor_id, year_month)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT DEFAULT '',
  email      TEXT DEFAULT '',
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new'
               CHECK(status IN ('new','in_progress','resolved')),
  created_at TEXT NOT NULL DEFAULT '',
  notes      TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO settings (key, value) VALUES
  ('business_name',     ''),
  ('business_address',  ''),
  ('business_phone',    ''),
  ('parking_name',      ''),
  ('parking_address',   ''),
  ('receipt_no_prefix', 'R')
ON CONFLICT (key) DO NOTHING;
