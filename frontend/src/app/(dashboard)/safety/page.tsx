'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { SafetyList } from '@/components/features/safety'

export default function SafetyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-neutral-900">
            セーフティ
          </h1>
          <Link href="/profile">
            <Button variant="outline" size="sm">
              ← 戻る
            </Button>
          </Link>
        </div>
        <p className="text-neutral-600">
          ブロックしたユーザーと通報履歴を管理できます
        </p>
      </div>

      {/* 注意事項 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-900 mb-2">
          📌 セーフティ機能について
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>ブロックしたユーザーとはお互いに表示されなくなります</li>
          <li>通報内容は運営チームが確認し、適切に対応します</li>
          <li>虚偽の通報は利用規約違反となります</li>
          <li>ブロックはいつでも解除できます</li>
        </ul>
      </div>

      {/* セーフティリスト */}
      <SafetyList />

      {/* ヘルプセクション */}
      <div className="mt-8 p-6 bg-neutral-50 border border-neutral-200 rounded-md">
        <h3 className="font-semibold text-neutral-900 mb-3">
          困ったときは
        </h3>
        <div className="space-y-2 text-sm text-neutral-700">
          <p>
            <Link
              href="/help/safety"
              className="text-primary-500 hover:underline"
            >
              セーフティガイド
            </Link>
            を確認する
          </p>
          <p>
            <Link
              href="/guidelines"
              className="text-primary-500 hover:underline"
            >
              コミュニティガイドライン
            </Link>
            を確認する
          </p>
          <p>
            <Link
              href="/support"
              className="text-primary-500 hover:underline"
            >
              サポートに問い合わせる
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

