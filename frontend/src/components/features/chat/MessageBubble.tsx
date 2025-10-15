'use client'

import { memo } from 'react'
import { Message } from '@/types/chat'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export const MessageBubble = memo(function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] md:max-w-[60%]',
          isOwn ? 'order-2' : 'order-1'
        )}
      >
        {/* 送信者名（相手のメッセージのみ） */}
        {!isOwn && (
          <p className="text-xs text-neutral-500 mb-1 px-2">
            {message.sender_name}
          </p>
        )}

        {/* メッセージバブル */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2 break-words',
            isOwn
              ? 'bg-primary-500 text-white rounded-br-sm'
              : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* タイムスタンプと既読状態 */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1 px-2',
            isOwn ? 'justify-end' : 'justify-start'
          )}
        >
          <p className="text-xs text-neutral-400">
            {new Date(message.created_at).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {isOwn && (
            <span className="text-xs text-neutral-400">
              {message.is_read ? '既読' : '未読'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

