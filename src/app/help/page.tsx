'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const FAQS = [
  {
    category: 'ログイン・アカウント',
    items: [
      {
        q: 'ログインできません',
        a: '以下をご確認ください。\n① 登録時のメールに届いた確認メール内のリンクをクリックしましたか？（クリックしないとログインできません）\n② 迷惑メールフォルダに確認メールが入っていませんか？\n③ パスワードを忘れた場合は「パスワードを忘れた方」からリセットできます。',
      },
      {
        q: 'パスワードを忘れました',
        a: 'ログイン画面の「パスワードを忘れた方」をタップし、登録したメールアドレスを入力してください。数分以内にパスワード再設定用のメールが届きます。',
      },
      {
        q: 'ログインIDとは何ですか？',
        a: 'メールアドレスの代わりにログインで使える短いIDです。設定画面の「アカウント設定」から登録できます。例: yamada123',
      },
      {
        q: '複数のスマートフォンで使えますか？',
        a: 'はい。同じアカウントでスマートフォン・タブレット・パソコンなど複数の端末からご利用いただけます。',
      },
    ],
  },
  {
    category: '入金チェック',
    items: [
      {
        q: '入金済みにするにはどうすればいいですか？',
        a: '「入金チェック」画面で対象の方のカードを開き、「入金済みにする」ボタンをタップするだけです。',
      },
      {
        q: '間違えて入金済みにしてしまいました',
        a: '入金済みにしたカードを開くと「未入金に戻す」ボタンがあります。そちらをタップすると元に戻せます。',
      },
      {
        q: '月を切り替えるにはどうすればいいですか？',
        a: '入金チェック画面の上部にある「◀ 2026年6月 ▶」の矢印をタップして月を変更できます。中央の月をタップすると年月を直接選ぶことができます。',
      },
      {
        q: 'CSVレポートはどこからダウンロードできますか？',
        a: '入金チェック画面の上部サマリーパネル内に「月次レポートをダウンロード」ボタンがあります。Excelや会計ソフトで開けるCSV形式です。',
      },
    ],
  },
  {
    category: '領収書・書類',
    items: [
      {
        q: '領収書を発行するにはどうすればいいですか？',
        a: '入金済みにしたカードに「領収書を発行・印刷」ボタンが表示されます。タップすると領収書画面が開くので、印刷してご使用ください。',
      },
      {
        q: '事業者名が入っていない領収書が出ます',
        a: '設定画面の「事業者・駐車場情報」で「事業者名」を登録してください。登録後は自動的に領収書に反映されます。',
      },
      {
        q: '車庫証明書はどこから出せますか？',
        a: '入金済みのカードに「車庫証明書」ボタンがあります。また、契約者画面でも発行できます。',
      },
    ],
  },
  {
    category: '区画・契約者',
    items: [
      {
        q: '区画を一気に追加したい',
        a: '区画画面の「まとめて追加」ボタンをタップすると、「1番〜20番」のように範囲指定で一括追加できます。',
      },
      {
        q: '契約者を削除すると入金記録も消えますか？',
        a: 'はい。契約者を削除すると関連する入金記録もすべて削除されます。記録を残したい場合は「アーカイブ」をご利用ください。',
      },
      {
        q: '契約終了日を設定すると何か変わりますか？',
        a: '終了30日前になるとホーム画面に「契約の期限が近い方」として通知が表示されます。',
      },
    ],
  },
  {
    category: 'データ・セキュリティ',
    items: [
      {
        q: 'データはどこに保存されていますか？',
        a: 'Supabase（国際的なクラウドサービス）のサーバーに暗号化して保存されています。他のユーザーのデータとは厳格に分離されており、アクセスされることはありません。',
      },
      {
        q: 'スマホを変えても使えますか？',
        a: 'はい。データはクラウドに保存されているため、新しいスマートフォンからでも同じアカウントでログインすれば引き続き使えます。',
      },
      {
        q: 'データをバックアップ・エクスポートできますか？',
        a: '「データ管理」画面から全データをCSV形式でエクスポートできます。定期的にダウンロードしておくことをお勧めします。',
      },
      {
        q: 'アカウントを削除したいのですが',
        a: '設定画面の下部にある「アカウントを削除する」からお手続きいただけます。削除後30日以内にすべてのデータが消去されます。',
      },
    ],
  },
];

export default function HelpPage() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpenMap(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* ヘッダー */}
      <div className="bg-slate-800 text-white px-5 py-6 -mx-4 md:-mx-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <HelpCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">ヘルプ・よくある質問</h1>
            <p className="text-slate-400 text-sm">わからないことはこちらで解決できます</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-6 px-1">
        {FAQS.map(section => (
          <div key={section.category}>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">
              {section.category}
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {section.items.map((item, i) => {
                const key = `${section.category}-${i}`;
                const isOpen = !!openMap[key];
                return (
                  <div key={key}>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      <span className="font-medium text-slate-800 text-base pr-4 leading-snug">{item.q}</span>
                      {isOpen
                        ? <ChevronUp size={18} className="text-slate-400 shrink-0" />
                        : <ChevronDown size={18} className="text-slate-400 shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line pt-3">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 問い合わせ */}
      <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mx-1">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare size={20} className="text-emerald-600" />
          <p className="font-bold text-emerald-800">解決しない場合はお問い合わせください</p>
        </div>
        <p className="text-sm text-emerald-700 mb-3">
          問い合わせフォームからお気軽にご連絡ください。通常2営業日以内に返信します。
        </p>
        <Link
          href="/inquiries"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700"
        >
          <MessageSquare size={15} /> 問い合わせフォームへ
        </Link>
      </div>
    </div>
  );
}
