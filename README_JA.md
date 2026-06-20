# ParkLedger

小規模駐車場オーナー向けの、業務をまるごとデジタル化するSaaSアプリケーションです。

紙台帳・スプレッドシートによる管理を、AIを活用しながら独力で開発したWebアプリに置き換えました。

**技術スタック：** Next.js · TypeScript · Supabase · Vercel · Upstash Redis

🇺🇸 English version → [README.md](README.md)

---

## ライブデモ

> [parkledger.vercel.app](https://parkledger.vercel.app)

※ログインが必要です（スクリーンショットは下記）

---

## なぜ作ったか

日本の小規模駐車場オーナーの多くは、月次の入金管理を手書きの台帳で行い、未払いテナントには一件ずつ電話をかけているのが実情です。知人がまさにそういった状況でした。

ParkLedger はその業務をまるごと置き換えます。ターゲットユーザーは60代のIT未経験者。文字を大きく・コントラストを強く・操作を極力シンプルに設計し、スマートフォンでの現場利用を想定しています。

---

## スクリーンショット

### ダッシュボード — 今月の入金状況を一目で把握
![ダッシュボード](public/screenshots/dash.png)

### 入金チェック — 入金登録・月次レポートのダウンロード
![入金](public/screenshots/manage.png)

### 契約者管理 — 契約情報・車両情報の一元管理
![契約者](public/screenshots/user.png)

### 駐車区画 — 空き・使用中の状況をひと目で確認
![区画](public/screenshots/block.webp)

---

## 主な機能

| 機能 | 詳細 |
|------|------|
| **ダッシュボード** | 月次入金状況・空き率・契約満了予定をリアルタイム表示 |
| **入金管理** | 入金登録、月次レポートのCSVエクスポート |
| **契約者管理** | 契約期間・車両情報・アーカイブ管理 |
| **駐車区画** | 一括登録、空き／使用中のステータス管理 |
| **清掃記録** | 写真付きで清掃履歴を記録 |
| **問い合わせ** | テナントからの問い合わせをステータス管理 |
| **帳票印刷** | 駐車許可証・領収書のPDF印刷 |
| **マルチテナント** | 各事業者のデータを完全分離 |
| **PWA対応** | スマートフォンにインストール可能 |

---

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| **フロントエンド** | Next.js / TypeScript / Tailwind CSS |
| **バックエンド** | サーバーレスAPIルート（Next.js） |
| **データベース** | Supabase（PostgreSQL） |
| **認証** | Supabase Auth |
| **インフラ** | Vercel / Upstash Redis |

---

## セキュリティ

- Row-Level Security — データベースレベルでテナント間のデータを完全分離
- 認証エンドポイントへのレート制限（ブルートフォース対策）
- bcryptによるパスワードハッシュ化
- CSVエクスポートへのインジェクション対策
- 画像アップロードの検証

---

## 開発プロセス

本プロジェクトはAIコーディングツールを活用して開発しました。

問題定義・機能設計・UX設計・改善サイクルを自分で担い、実装の加速にAIを活用するスタイルで進めました。

このプロジェクトを通じて、フルスタックWebアプリケーションの設計・実装・本番運用に至るまでの一連の流れを実践的に習得しました。

---

<details>
<summary>アーキテクチャ詳細（エンジニア向け）</summary>

```
ブラウザ
   │
   ▼
Next.js（Vercel）── サーバーサイドレンダリング + APIルート
   │
   ▼
Supabase（PostgreSQL）
   │
   ├── Row-Level Security ── テナントごとにデータを自動スコープ
   └── Auth ── セッション管理 + カスタムログインID解決
   │
   ▼
Upstash Redis ── サーバーレス環境を跨いだ永続的なレート制限
```

</details>

---

## ローカル開発

```bash
# 1. リポジトリをクローン
git clone https://github.com/yuki-dev-app/parkledger.git
cd parkledger

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数を設定
cp .env.local.example .env.local
# SupabaseとUpstashの認証情報を入力

# 4. 開発サーバーを起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開く。

**必要な環境変数：**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
