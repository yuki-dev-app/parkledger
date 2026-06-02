export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-slate-500 mb-8">最終更新: 2026年6月</p>

      <div className="space-y-6 text-base text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. 収集する情報</h2>
          <p>ParkLedger（以下「本サービス」）は、サービス提供のために以下の情報を収集します。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
            <li>メールアドレス（ログイン用）</li>
            <li>お客様が入力した駐車場・契約者・入金に関するデータ</li>
            <li>アクセスログ（サービス改善・セキュリティ目的）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. データの保管</h2>
          <p>入力されたデータはSupabase（アイルランド・EU域内）のサーバーに暗号化して保管されます。データは事業者ごとに厳格に分離され、他の事業者からはアクセスできません。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. 第三者への提供</h2>
          <p>法令に基づく場合を除き、お客様の情報を第三者に提供・販売することはありません。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">4. セキュリティ</h2>
          <p>SSL/TLS暗号化通信を使用しています。パスワードはハッシュ化して保管され、平文で保存されることはありません。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">5. データの削除</h2>
          <p>アカウントの削除をご希望の場合は、設定画面またはお問い合わせフォームよりご連絡ください。速やかに対応いたします。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">6. お問い合わせ</h2>
          <p>プライバシーに関するご質問はサポートまでお問い合わせください。</p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200">
        <a href="/login" className="text-slate-600 hover:text-slate-900 text-sm underline">← ログインに戻る</a>
      </div>
    </div>
  );
}
