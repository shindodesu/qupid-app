'use client'

import { use } from 'react'
import { ChatWindow } from '@/components/features/chat'

interface ChatDetailPageProps {
  params: Promise<{
    conversationId: string
  }>
}

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  const resolvedParams = use(params)
  const conversationId = parseInt(resolvedParams.conversationId, 10)

  if (isNaN(conversationId)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600">無効な会話IDです</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      <ChatWindow conversationId={conversationId} />
    </div>
  )
}

