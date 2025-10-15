'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@/lib/api/chat'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { ReportDialog, BlockConfirm } from '@/components/features/safety'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/stores/auth'
import type { Message } from '@/types/chat'
import Link from 'next/link'

interface ChatWindowProps {
  conversationId: number
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const user = useUser()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // メッセージ履歴取得
  const { data: messagesData, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId, 100, 0),
    refetchInterval: 5000, // 5秒ごとに自動更新（簡易的なリアルタイム）
  })

  // メッセージ送信
  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(conversationId, content),
    onMutate: async (content) => {
      // 楽観的更新
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] })
      
      const previousMessages = queryClient.getQueryData<any>(['messages', conversationId])
      
      if (previousMessages && user) {
        const optimisticMessage: Message = {
          id: Date.now(), // 一時的なID
          content,
          sender_id: user.id,
          sender_name: user.display_name,
          is_read: false,
          created_at: new Date().toISOString(),
        }
        
        queryClient.setQueryData(['messages', conversationId], {
          ...previousMessages,
          messages: [...previousMessages.messages, optimisticMessage],
        })
      }
      
      return { previousMessages }
    },
    onError: (error, variables, context) => {
      // エラー時にロールバック
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages)
      }
    },
    onSuccess: () => {
      // メッセージ履歴を再取得
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      // 会話一覧も更新
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // 未読メッセージを既読にする
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: number) =>
      chatApi.markMessageAsRead(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // スクロール位置の監視
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      setIsNearBottom(distanceFromBottom < 100)
    }
  }

  // 最下部にスクロール
  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  // メッセージが更新されたら最下部にスクロール
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom(true)
    }
  }, [messagesData?.messages, isNearBottom])

  // 初回読み込み時は強制的に最下部へ
  useEffect(() => {
    if (messagesData?.messages && messagesData.messages.length > 0) {
      scrollToBottom(false)
    }
  }, [messagesData?.messages.length])

  // 未読メッセージを既読にする
  useEffect(() => {
    if (messagesData?.messages && user) {
      const unreadMessages = messagesData.messages.filter(
        (msg) => !msg.is_read && msg.sender_id !== user.id
      )
      
      if (unreadMessages.length > 0) {
        // 最新の未読メッセージを既読にする
        const latestUnread = unreadMessages[unreadMessages.length - 1]
        markAsReadMutation.mutate(latestUnread.id)
      }
    }
  }, [messagesData?.messages, user])

  const handleSendMessage = (content: string) => {
    sendMutation.mutate(content)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">メッセージの読み込みに失敗しました</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })}>
            再読み込み
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  const messages = messagesData?.messages || []
  const otherUser = messages[0] ? messages.find(m => m.sender_id !== user?.id) : null
  const otherUserId = otherUser?.sender_id
  const otherUserName = otherUser?.sender_name || '会話'

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="border-b border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {otherUserName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* メニューボタン */}
            {otherUserId && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-neutral-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-md shadow-lg z-20">
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          setShowReportDialog(true)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      >
                        🚨 通報する
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          setShowBlockConfirm(true)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚫 ブロックする
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <Link href="/chat">
              <Button variant="outline" size="sm">
                ← 戻る
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* メッセージリスト */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-neutral-50"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-neutral-600">メッセージを送信して会話を始めましょう</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 最下部にスクロールボタン */}
      {!isNearBottom && (
        <div className="absolute bottom-20 right-4">
          <Button
            onClick={() => scrollToBottom(true)}
            size="icon"
            className="rounded-full shadow-lg"
          >
            ↓
          </Button>
        </div>
      )}

      {/* メッセージ入力 */}
      <MessageComposer
        onSend={handleSendMessage}
        disabled={sendMutation.isPending}
      />

      {/* 通報ダイアログ */}
      {otherUserId && (
        <>
          <ReportDialog
            isOpen={showReportDialog}
            onClose={() => setShowReportDialog(false)}
            targetUserId={otherUserId}
            targetUserName={otherUserName}
          />

          <BlockConfirm
            isOpen={showBlockConfirm}
            onClose={() => setShowBlockConfirm(false)}
            targetUserId={otherUserId}
            targetUserName={otherUserName}
            onSuccess={() => {
              // ブロック成功後、チャット一覧に戻る
              window.location.href = '/chat'
            }}
          />
        </>
      )}
    </div>
  )
}

