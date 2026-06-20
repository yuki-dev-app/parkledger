import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">利用規約</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">制定：2026年1月1日　最終更新：2026年6月3日</p>

      <div className="space-y-8 text-base text-slate-700 dark:text-slate-300 leading-relaxed">

        <section>
          <p>
            本利用規約（以下「本規約」）は、ParkLedger（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意のうえ本サービスをご利用ください。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第1条　適用</h2>
          <p>本規約は、本サービスの利用に関する一切の関係に適用されます。本サービスの利用を開始した時点で、本規約に同意したものとみなします。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第2条　アカウント</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 pl-2">
            <li>登録には正確なメールアドレスが必要です。</li>
            <li>アカウントの管理はユーザーの責任で行ってください。</li>
            <li>パスワードを第三者と共有しないでください。</li>
            <li>不正アクセスを発見した場合は直ちにご連絡ください。</li>
            <li>1事業者につき1アカウントを原則とします。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第3条　禁止事項</h2>
          <p className="mb-2">以下の行為を禁止します。</p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>不正アクセス・クラッキング行為</li>
            <li>本サービスのサーバー・ネットワークへの過度な負荷</li>
            <li>他のユーザーのデータへの不正アクセス</li>
            <li>虚偽の情報を登録する行為</li>
            <li>本サービスを商業目的で無断転売・再頒布する行為</li>
            <li>リバースエンジニアリング・逆コンパイルする行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第4条　サービスの提供・変更・停止</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 pl-2">
            <li>運営者は事前通知なくサービス内容を変更・停止する場合があります。</li>
            <li>システムメンテナンス時は一時的に利用できないことがあります。</li>
            <li>サービス終了の場合は30日前までにメールで通知します。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第5条　データの取り扱い</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 pl-2">
            <li>ユーザーが登録したデータの著作権・所有権はユーザーに帰属します。</li>
            <li>運営者はユーザーのデータをサービス提供目的以外には使用しません。</li>
            <li>ユーザーはCSV形式でデータをいつでもエクスポートできます。</li>
            <li>アカウント削除後30日以内にすべてのデータを削除します。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第6条　知的財産権</h2>
          <p>本サービスのシステム・デザイン・ロゴ等に関する知的財産権は運営者に帰属します。ユーザーは個人利用の範囲でのみ使用できます。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第7条　免責事項</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 pl-2">
            <li>本サービスは現状有姿で提供されます。特定目的への適合性を保証しません。</li>
            <li>本サービスの利用によって生じた損害について、運営者の故意・重過失の場合を除き責任を負いません。</li>
            <li>本サービスと外部サービス（会計ソフト等）との連携結果について保証しません。</li>
            <li>天災・サイバー攻撃・通信障害等の不可抗力による損害について責任を負いません。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第8条　アカウントの停止・解除</h2>
          <p className="mb-2">以下の場合、事前通知なくアカウントを停止・解除することがあります。</p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-2">
            <li>本規約に違反した場合</li>
            <li>長期間（12ヶ月以上）利用がなく、メール通知後も応答がない場合</li>
            <li>不正行為・迷惑行為が確認された場合</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第9条　規約の変更</h2>
          <p>重要な変更の場合は30日前までにメールで通知します。変更後も継続利用した場合は変更後の規約に同意したものとみなします。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第10条　準拠法・管轄</h2>
          <p>本規約は日本法に準拠します。紛争については京都地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">第11条　お問い合わせ</h2>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-600 dark:text-slate-400">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">ParkLedger 運営事務局</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">お問い合わせはアプリ内のフォームよりお願いします。</p>
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
