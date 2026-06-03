import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">プライバシーポリシー</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">制定：2026年1月1日　最終更新：2026年6月3日</p>

      <div className="space-y-8 text-base text-slate-700 dark:text-slate-300 leading-relaxed">

        <section>
          <p>
            ParkLedger（以下「本サービス」）は、利用者（以下「ユーザー」）の個人情報およびデータの取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。本サービスをご利用になる場合は、本ポリシーに同意したものとみなします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第1条　収集する情報</h2>
          <p className="mb-2">本サービスは、以下の情報を収集します。</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 pl-2">
            <li><strong>アカウント情報</strong>：メールアドレス、パスワード（ハッシュ化して保管）</li>
            <li><strong>業務データ</strong>：ユーザーが入力した駐車区画・契約者・入金・清掃・問い合わせに関する情報</li>
            <li><strong>アクセスログ</strong>：IPアドレス、ブラウザ種別、アクセス日時（セキュリティ・障害対応目的）</li>
            <li><strong>デバイス情報</strong>：OS・ブラウザのバージョン情報（サービス改善目的）</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第2条　利用目的</h2>
          <p className="mb-2">収集した情報は、以下の目的でのみ利用します。</p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-2">
            <li>本サービスの提供・運営・改善</li>
            <li>ユーザー認証およびアカウント管理</li>
            <li>不正アクセス・セキュリティ脅威の検知・対応</li>
            <li>障害発生時の調査・復旧</li>
            <li>法令上の義務の履行</li>
          </ul>
          <p className="mt-3 text-slate-600 dark:text-slate-400">上記以外の目的で個人情報を利用する場合は、事前にユーザーの同意を得るものとします。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第3条　データの保管・管理</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600 pl-2">
            <li>データは <strong>Supabase（本社：米国、EU域内データセンターを含む）</strong> のサーバーに保管されます。</li>
            <li>保管データはすべて暗号化（AES-256）されています。</li>
            <li>通信はSSL/TLS（HTTPS）で暗号化されます。</li>
            <li>各ユーザーのデータはテナント単位で厳密に分離されており、他事業者のデータにアクセスすることはできません（行レベルセキュリティ・RLSにより制御）。</li>
            <li>パスワードは bcrypt でハッシュ化して保管し、平文では保存しません。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第4条　第三者への提供・共有</h2>
          <p className="mb-2">以下の場合を除き、ユーザーの情報を第三者に提供・販売・貸与することはありません。</p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-2">
            <li>ユーザーの事前の同意がある場合</li>
            <li>法令・裁判所命令・行政機関の指示に基づく場合</li>
            <li>人命・財産の保護のために緊急に必要な場合</li>
          </ul>
          <p className="mt-3 text-slate-600 dark:text-slate-400">本サービスは、サービス提供のためSupabase（インフラ）を利用しています。これらは業務委託先であり、必要最小限の情報のみを取り扱います。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第5条　Cookie・ローカルストレージの使用</h2>
          <p className="mb-2">本サービスは以下の目的でCookieを使用します。</p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-2">
            <li><strong>認証セッションの維持</strong>（ログイン状態を保持するために必須）</li>
            <li><strong>セキュリティ</strong>（CSRF対策・不正アクセス検知）</li>
          </ul>
          <p className="mt-3 text-slate-600 dark:text-slate-400">広告目的のCookieや第三者トラッキングCookieは使用しません。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第6条　データの保持期間</h2>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-2">
            <li>業務データ：アカウント有効期間中、継続して保管します。</li>
            <li>アクセスログ：最大90日間保管後、自動削除します。</li>
            <li>アカウント削除後：30日以内にすべてのデータを削除します（法令上の保存義務がある場合を除く）。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第7条　ユーザーの権利</h2>
          <p className="mb-2">ユーザーは以下の権利を有します。</p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-2">
            <li><strong>開示請求</strong>：本サービスが保管するご自身のデータの開示を求める権利</li>
            <li><strong>訂正・削除</strong>：不正確なデータの訂正、または削除を求める権利</li>
            <li><strong>利用停止</strong>：特定のデータ処理の停止を求める権利</li>
            <li><strong>データポータビリティ</strong>：ご自身のデータをCSV等の汎用形式でエクスポートする権利（設定画面より実行可能）</li>
          </ul>
          <p className="mt-3 text-slate-600 dark:text-slate-400">権利行使をご希望の場合は、下記お問い合わせ先までご連絡ください。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第8条　セキュリティ</h2>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-2">
            <li>SSL/TLS暗号化通信（HTTPS）を全ページで強制適用</li>
            <li>パスワードのbcryptハッシュ化保管（平文保存なし）</li>
            <li>APIへのレート制限（短時間の大量アクセスをブロック）</li>
            <li>行レベルセキュリティ（RLS）による他テナントデータへのアクセス遮断</li>
            <li>不審なアクセスパターンの監視</li>
          </ul>
          <p className="mt-3 text-slate-600 dark:text-slate-400">セキュリティインシデントを発見した場合は、72時間以内にユーザーへ通知します。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第9条　未成年者の利用</h2>
          <p>本サービスは事業者向けのBtoBサービスであり、18歳未満の方の個人利用は想定しておりません。18歳未満の方が利用していることが判明した場合は、アカウントを停止することがあります。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第10条　ポリシーの変更</h2>
          <p>本ポリシーを変更する場合は、変更後のポリシーを本ページに掲載するとともに、重要な変更の場合はメールで事前通知します。変更後も本サービスを継続利用した場合は、変更後のポリシーに同意したものとみなします。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第11条　準拠法・管轄裁判所</h2>
          <p>本ポリシーは日本法に準拠します。本ポリシーに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第12条　お問い合わせ</h2>
          <p className="mb-2">プライバシーに関するご質問・ご要望は、以下の方法でお問い合わせください。</p>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-600 dark:text-slate-400">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">ParkLedger サポート窓口</p>
            <p>受付時間：平日 9:00〜18:00</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">※ アプリ内の問い合わせフォームからもお問い合わせいただけます。</p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <Link href="/login" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm underline underline-offset-2">← ログインに戻る</Link>
        <p className="text-xs text-slate-400 dark:text-slate-500">ParkLedger © 2026</p>
      </div>
    </div>
  );
}
