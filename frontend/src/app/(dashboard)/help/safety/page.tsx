'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function SafetyGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-neutral-900">
            セーフティガイド
          </h1>
          <Link href="/safety">
            <Button variant="outline" size="sm">
              ← 戻る
            </Button>
          </Link>
        </div>
        <p className="text-neutral-600">
          Qupidを安全に利用するためのガイドラインです
        </p>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-8">
        {/* 基本ルール */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🛡️</span>
            基本ルール
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">個人情報の保護</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>本名、住所、電話番号、メールアドレスは共有しない</li>
                <li>SNSアカウントや外部サイトへのリンクは控える</li>
                <li>勤務先や学校名などの詳細な情報は避ける</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">写真の取り扱い</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>顔がはっきり見える写真を使用する</li>
                <li>不適切な写真は禁止（ヌード、暴力的な内容など）</li>
                <li>他人の写真を無断使用しない</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 安全な出会い */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🤝</span>
            安全な出会いのために
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">初回の出会い</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>公共の場所で会う</li>
                <li>友人や家族に会う場所と時間を伝える</li>
                <li>自分の飲み物から目を離さない</li>
                <li>不快に感じたら遠慮なく帰る</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">オンラインでのやり取り</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>相手をよく知ってから個人情報を共有する</li>
                <li>お金の要求には応じない</li>
                <li>不適切な内容のメッセージは無視する</li>
              </ul>
            </div>
          </div>
        </section>

        {/* トラブル時の対処法 */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">⚠️</span>
            トラブル時の対処法
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">通報すべき行為</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>ハラスメントやストーキング</li>
                <li>詐欺や金銭の要求</li>
                <li>不適切な写真やメッセージ</li>
                <li>虚偽のプロフィール情報</li>
                <li>未成年者の利用</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">緊急時</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>危険を感じたらすぐにその場を離れる</li>
                <li>必要に応じて警察に通報する（110番）</li>
                <li>証拠を保存する（スクリーンショットなど）</li>
              </ul>
            </div>
          </div>
        </section>

        {/* プライバシー設定 */}
        <section className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🔒</span>
            プライバシー設定
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">アプリ内設定</h3>
              <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
                <li>プロフィールの表示範囲を設定する</li>
                <li>位置情報の共有設定を確認する</li>
                <li>ブロック機能を活用する</li>
                <li>通報機能を使用する</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 連絡先 */}
        <section className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📞</span>
            緊急連絡先
          </h2>
          <div className="space-y-2 text-sm text-red-800">
            <p><strong>警察：</strong>110番</p>
            <p><strong>救急：</strong>119番</p>
            <p><strong>Qupidサポート：</strong>
              <Link href="/support" className="text-red-600 hover:underline ml-1">
                サポートページ
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
