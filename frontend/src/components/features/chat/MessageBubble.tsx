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
              ? 'bg-pink-400 text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-neutral-900 rounded-bl-sm'
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
              hour12: true,
            })}
          </p>
          {isOwn && (
            <div className="flex items-center gap-1">
              {message.is_read ? (
                <div className="flex">
                  <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-3 h-3 text-red-500 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="flex">
                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

