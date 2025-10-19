'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { chatApi } from '@/lib/api/chat'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConversationList } from '@/components/features/chat'

export default function ChatPage() {
  // 会話一覧取得
  const { data: conversationsData, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(50, 0),
    refetchInterval: 10000, // 10秒ごとに更新
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl bg-white min-h-screen">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              チャット
            </h1>
            <p className="text-neutral-600">
              マッチした人とメッセージを交換しましょう
            </p>
          </div>
          <Link href="/matches">
            <Button variant="outline">
              マッチ一覧
            </Button>
          </Link>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          会話一覧の取得に失敗しました
        </div>
      )}

      {/* 会話一覧 */}
      <Card>
        <CardContent className="p-0">
          <ConversationList
            conversations={conversationsData?.conversations || []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* 未読数の合計 */}
      {conversationsData && conversationsData.conversations.length > 0 && (
        <div className="mt-4 text-center text-sm text-neutral-500">
          {conversationsData.conversations.reduce(
            (sum, conv) => sum + conv.unread_count,
            0
          ) > 0 && (
            <p>
              未読メッセージ:{' '}
              <span className="font-semibold text-primary-500">
                {conversationsData.conversations.reduce(
                  (sum, conv) => sum + conv.unread_count,
                  0
                )}
              </span>
              件
            </p>
          )}
        </div>
      )}
    </div>
  )
}

