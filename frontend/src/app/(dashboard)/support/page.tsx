'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-neutral-900">
            サポート
          </h1>
          <Link href="/safety">
            <Button variant="outline" size="sm">
              ← 戻る
            </Button>
          </Link>
        </div>
        <p className="text-neutral-600">
          よくある質問とサポート情報をご確認ください
        </p>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-8">
        {/* よくある質問 */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">❓</span>
            よくある質問
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Q. アカウントの設定方法は？</h3>
              <p className="text-sm text-neutral-700">
                プロフィールページから各種設定を変更できます。プロフィール写真、自己紹介文、設定項目を編集できます。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Q. ユーザーをブロックするには？</h3>
              <p className="text-sm text-neutral-700">
                ユーザーのプロフィール画面またはチャット画面からブロック機能を使用できます。ブロックしたユーザーとは相互に表示されなくなります。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Q. 通報はどのように行いますか？</h3>
              <p className="text-sm text-neutral-700">
                不適切な行為を発見した場合は、該当ユーザーのプロフィール画面から通報機能をご利用ください。運営チームが確認し、適切に対応します。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Q. アカウントを削除したい場合は？</h3>
              <p className="text-sm text-neutral-700">
                設定画面からアカウント削除が可能です。削除前にデータのバックアップをお勧めします。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Q. マッチした相手と連絡が取れません</h3>
              <p className="text-sm text-neutral-700">
                マッチ後、お互いにメッセージを送信する必要があります。相手からの返信をお待ちください。
              </p>
            </div>
          </div>
        </section>

        {/* トラブルシューティング */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🔧</span>
            トラブルシューティング
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">アプリが動かない場合</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>アプリを一度終了して再起動する</li>
                <li>デバイスを再起動する</li>
                <li>アプリの最新版に更新する</li>
                <li>インターネット接続を確認する</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">通知が届かない場合</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>デバイスの通知設定を確認する</li>
                <li>アプリ内の通知設定を確認する</li>
                <li>バッテリー最適化設定を確認する</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">写真がアップロードできない場合</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>ファイルサイズが適切か確認する（推奨：5MB以下）</li>
                <li>対応している画像形式か確認する（JPEG、PNG）</li>
                <li>インターネット接続が安定しているか確認する</li>
              </ul>
            </div>
          </div>
        </section>

        {/* お問い合わせ */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📧</span>
            お問い合わせ
          </h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📱 アプリ内サポート</h3>
              <p className="text-sm text-blue-800 mb-2">
                アプリ内の設定画面から直接サポートチームに連絡できます。
              </p>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                  設定画面へ
                </Button>
              </Link>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">📧 メールサポート</h3>
              <p className="text-sm text-green-800 mb-2">
                詳細な問題についてはメールでお問い合わせください。
              </p>
              <p className="text-sm text-green-800 font-mono">
                support@qupid.app
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">⏰ 対応時間</h3>
              <p className="text-sm text-purple-800">
                平日 9:00-18:00（土日祝日を除く）<br />
                回答までに1-3営業日程度かかる場合があります。
              </p>
            </div>
          </div>
        </section>

        {/* 緊急時 */}
        <section className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🚨</span>
            緊急時
          </h2>
          <div className="space-y-2 text-sm text-red-800">
            <p><strong>危険を感じた場合：</strong></p>
            <p>• すぐにその場を離れる</p>
            <p>• 警察に通報する（110番）</p>
            <p>• 証拠を保存する（スクリーンショットなど）</p>
            <p>• アプリ内で緊急通報機能を使用する</p>
          </div>
        </section>

        {/* 関連リンク */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🔗</span>
            関連リンク
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/help/safety" className="block">
              <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-neutral-900 mb-2">🛡️ セーフティガイド</h3>
                <p className="text-sm text-neutral-600">安全にアプリを利用するためのガイド</p>
              </div>
            </Link>
            <Link href="/guidelines" className="block">
              <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-neutral-900 mb-2">📋 コミュニティガイドライン</h3>
                <p className="text-sm text-neutral-600">コミュニティルールと禁止事項</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
