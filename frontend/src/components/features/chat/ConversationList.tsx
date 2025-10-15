'use client'

import Link from 'next/link'
import { Conversation } from '@/types/chat'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId?: number
  isLoading?: boolean
}

export function ConversationList({
  conversations,
  currentConversationId,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg text-neutral-600 mb-2">会話がありません</p>
          <p className="text-sm text-neutral-500">
            マッチした人とメッセージを始めましょう
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-neutral-200">
      {conversations.map((conversation) => {
        const isActive = currentConversationId === conversation.id
        const isUnread = conversation.unread_count > 0

        return (
          <Link
            key={conversation.id}
            href={`/chat/${conversation.id}`}
            className={cn(
              'block hover:bg-neutral-50 transition-colors',
              isActive && 'bg-primary-50'
            )}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'font-semibold text-neutral-900 truncate',
                      isUnread && 'font-bold'
                    )}
                  >
                    {conversation.other_user.display_name}
                  </h3>
                  {conversation.other_user.bio && (
                    <p className="text-xs text-neutral-500 truncate">
                      {conversation.other_user.bio}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  {conversation.last_message && (
                    <span className="text-xs text-neutral-400">
                      {new Date(
                        conversation.last_message.created_at
                      ).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                  {isUnread && (
                    <Badge variant="default" size="sm" className="min-w-[1.5rem]">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
              </div>

              {conversation.last_message && (
                <p
                  className={cn(
                    'text-sm truncate',
                    isUnread
                      ? 'text-neutral-900 font-medium'
                      : 'text-neutral-600'
                  )}
                >
                  {conversation.last_message.content}
                </p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

