'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { searchApi } from '@/lib/api/search'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ReportDialog, BlockConfirm } from '@/components/features/safety'

export default function MatchesPage() {
  const [reportUserId, setReportUserId] = useState<number | null>(null)
  const [reportUserName, setReportUserName] = useState<string>('')
  const [blockUserId, setBlockUserId] = useState<number | null>(null)
  const [blockUserName, setBlockUserName] = useState<string>('')
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)

  // マッチ一覧取得
  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => searchApi.getMatches(),
  })

  const handleOpenReport = (userId: number, userName: string) => {
    setReportUserId(userId)
    setReportUserName(userName)
    setShowReportDialog(true)
  }

  const handleOpenBlock = (userId: number, userName: string) => {
    setBlockUserId(userId)
    setBlockUserName(userName)
    setShowBlockConfirm(true)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          マッチ
        </h1>
        <p className="text-neutral-600">
          マッチした人とチャットを始めましょう
        </p>
      </div>

      {/* マッチ一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-neutral-600">読み込み中...</p>
          </div>
        </div>
      ) : matchesData && matchesData.matches && matchesData.matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchesData.matches.map((match: any) => (
            <Card key={match.user.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {match.user.display_name}
                    </h3>
                    {(match.user.faculty || match.user.grade) && (
                      <p className="text-sm text-neutral-600 mt-1">
                        {[match.user.faculty, match.user.grade].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">
                      マッチ済み
                    </Badge>
                    
                    {/* メニューボタン */}
                    <div className="relative group">
                      <button className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
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
                      
                      <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-md shadow-lg z-20">
                        <button
                          onClick={() => handleOpenReport(match.user.id, match.user.display_name)}
                          className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        >
                          🚨 通報する
                        </button>
                        <button
                          onClick={() => handleOpenBlock(match.user.id, match.user.display_name)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          🚫 ブロックする
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {match.user.bio && (
                  <p className="text-sm text-neutral-700 mb-4 line-clamp-2">
                    {match.user.bio}
                  </p>
                )}

                {match.user.tags && match.user.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {match.user.tags.slice(0, 3).map((tag: any) => (
                      <Badge key={tag.id} variant="outline" size="sm">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={async () => {
                    try {
                      // 会話を作成または既存の会話を取得
                      const { chatApi } = await import('@/lib/api/chat')
                      const conversation = await chatApi.createConversation(match.user.id)
                      // チャット画面に遷移
                      window.location.href = `/chat/${conversation.id}`
                    } catch (error) {
                      console.error('Failed to create conversation:', error)
                      alert('会話の作成に失敗しました')
                    }
                  }}
                >
                  💬 チャットを開く
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">💕</div>
            <p className="text-lg text-neutral-600 mb-2">まだマッチがありません</p>
            <p className="text-sm text-neutral-500 mb-6">
              ユーザーを探していいねを送ってみましょう
            </p>
            <Link href="/search">
              <Button>ユーザーを探す</Button>
            </Link>
          </div>
        </div>
      )}

      {/* 通報ダイアログ */}
      {reportUserId && (
        <ReportDialog
          isOpen={showReportDialog}
          onClose={() => {
            setShowReportDialog(false)
            setReportUserId(null)
            setReportUserName('')
          }}
          targetUserId={reportUserId}
          targetUserName={reportUserName}
        />
      )}

      {/* ブロック確認ダイアログ */}
      {blockUserId && (
        <BlockConfirm
          isOpen={showBlockConfirm}
          onClose={() => {
            setShowBlockConfirm(false)
            setBlockUserId(null)
            setBlockUserName('')
          }}
          targetUserId={blockUserId}
          targetUserName={blockUserName}
          onSuccess={() => {
            // ブロック成功後、マッチ一覧を再取得
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

