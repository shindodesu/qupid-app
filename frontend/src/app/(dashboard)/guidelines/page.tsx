'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function CommunityGuidelinesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-neutral-900">
            コミュニティガイドライン
          </h1>
          <Link href="/safety">
            <Button variant="outline" size="sm">
              ← 戻る
            </Button>
          </Link>
        </div>
        <p className="text-neutral-600">
          Qupidコミュニティを健全に保つためのガイドラインです
        </p>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-8">
        {/* 基本原則 */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">💖</span>
            基本原則
          </h2>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">✅ 推奨される行動</h3>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>相手を尊重し、誠実に接する</li>
                <li>共通の趣味や価値観を見つけて交流する</li>
                <li>安全で健全な関係を築く</li>
                <li>多様性を認め、受け入れる</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 禁止事項 */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">❌</span>
            禁止事項
          </h2>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">🚫 ハラスメント・差別</h3>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>人種、性別、年齢、宗教、性的指向による差別</li>
                <li>性的ハラスメントや不適切なコメント</li>
                <li>ストーキングや執拗な連絡</li>
                <li>脅迫や威嚇的な言動</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">🚫 詐欺・金銭要求</h3>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>金銭の要求や借金の申し込み</li>
                <li>投資話やビジネス勧誘</li>
                <li>虚偽の情報や写真の使用</li>
                <li>個人情報の不正取得</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">🚫 不適切なコンテンツ</h3>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>ヌード写真や性的な画像</li>
                <li>暴力や危険行為を描写した内容</li>
                <li>薬物やアルコールの過度な宣伝</li>
                <li>スパムや宣伝目的の投稿</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">🚫 未成年者の利用</h3>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>18歳未満のユーザーの登録</li>
                <li>未成年者との不適切なやり取り</li>
                <li>年齢詐称</li>
              </ul>
            </div>
          </div>
        </section>

        {/* プロフィールガイドライン */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">👤</span>
            プロフィールガイドライン
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">適切なプロフィール写真</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>顔がはっきり見える写真を使用する</li>
                <li>一人で写っている写真が望ましい</li>
                <li>明るく、はっきりとした画像を使用する</li>
                <li>適切な服装で撮影された写真</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">自己紹介文</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>自分の性格や趣味について書く</li>
                <li>相手に伝えたいことを明確に表現する</li>
                <li>ポジティブで魅力的な内容にする</li>
                <li>個人情報は避ける</li>
              </ul>
            </div>
          </div>
        </section>

        {/* メッセージングガイドライン */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">💬</span>
            メッセージングガイドライン
          </h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 良いメッセージの例</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>相手のプロフィールに興味を示す</li>
                <li>共通の趣味について話す</li>
                <li>質問をして会話を始める</li>
                <li>礼儀正しく、丁寧な言葉遣い</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">❌ 避けるべきメッセージ</h3>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>性的な内容や不適切な表現</li>
                <li>相手を批判したり、傷つける内容</li>
                <li>執拗な連絡やしつこいアプローチ</li>
                <li>スパムや宣伝目的のメッセージ</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 違反時の対応 */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">⚖️</span>
            違反時の対応
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">通報と対応</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>ガイドライン違反を発見した場合は通報する</li>
                <li>運営チームが内容を確認し、適切に対応する</li>
                <li>違反の程度に応じて警告、一時停止、永久停止を実施</li>
                <li>虚偽の通報は禁止されている</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">アカウント制限</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>軽微な違反：警告</li>
                <li>中程度の違反：一時的なアカウント停止</li>
                <li>重大な違反：永久アカウント停止</li>
                <li>法的問題：関連機関への通報</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 連絡先 */}
        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📞</span>
            お問い合わせ
          </h2>
          <div className="space-y-2 text-sm text-yellow-800">
            <p>ガイドラインに関する質問や通報は以下からお願いします：</p>
            <p><strong>通報：</strong>アプリ内の通報機能をご利用ください</p>
            <p><strong>サポート：</strong>
              <Link href="/support" className="text-yellow-600 hover:underline ml-1">
                サポートページ
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
