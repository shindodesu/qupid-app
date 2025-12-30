'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { chatApi } from '@/lib/api/chat'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConversationList } from '@/components/features/chat'
import { PageTransition } from '@/components/ui/PageTransition'
import { useTheme } from '@/hooks/useTheme'

export default function ChatPage() {
  const theme = useTheme()
  // 会話一覧取得
  const { data: conversationsData, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(50, 0),
    refetchInterval: 10000, // 10秒ごとに更新
  })

  return (
    <PageTransition variant="slide">
      <div className="min-h-screen bg-theme-page relative overflow-hidden">
        <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
          {/* ヘッダー */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h1 className="text-3xl font-bold text-theme-primary mb-1">
                  チャット
                </h1>
                <p className="text-sm text-neutral-600">
                  マッチした人とメッセージを交換しましょう
                </p>
              </motion.div>
              <Link href="/matches">  
              </Link>
            </div>
          </motion.div>

          {/* エラー表示 */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-red-50 border border-red-200/50 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm"
            >
              <p className="font-medium">会話一覧の取得に失敗しました</p>
            </motion.div>
          )}

          {/* 会話一覧 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-theme-primary/20 shadow-2xl shadow-theme bg-white/80 backdrop-blur-md hover:shadow-theme-lg transition-all duration-300">
              <CardContent className="p-0">
                <ConversationList
                  conversations={conversationsData?.conversations || []}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* 未読数の合計 */}
          {conversationsData && conversationsData.conversations.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-center text-sm text-neutral-500"
            >
              {conversationsData.conversations.reduce(
                (sum, conv) => sum + conv.unread_count,
                0
              ) > 0 && (
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  未読メッセージ:{' '}
                  <span className="font-semibold text-theme-primary">
                    {conversationsData.conversations.reduce(
                      (sum, conv) => sum + conv.unread_count,
                      0
                    )}
                  </span>
                  件
                </motion.p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

