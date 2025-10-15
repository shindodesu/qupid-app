'use client'

import { useState, memo, useCallback } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ReportDialog, BlockConfirm } from '@/components/features/safety'
import type { UserSearchResult } from '@/types/search'
import { cn } from '@/lib/utils'

interface UserCardProps {
  user: UserSearchResult
  onLike: (userId: number) => Promise<void>
  onUnlike: (userId: number) => Promise<void>
}

export const UserCard = memo(function UserCard({ user, onLike, onUnlike }: UserCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { like_status } = user

  const handleLikeClick = useCallback(async () => {
    setIsLoading(true)
    try {
      if (like_status.i_liked) {
        await onUnlike(user.id)
      } else {
        await onLike(user.id)
      }
    } finally {
      setIsLoading(false)
    }
  }, [like_status.i_liked, onUnlike, onLike, user.id])

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900">
                {user.display_name}
              </h3>
              {(user.faculty || user.grade) && (
                <p className="text-sm text-neutral-600 mt-1">
                  {[user.faculty, user.grade].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {like_status.is_matched && (
                <Badge variant="success" size="sm">
                  マッチ済み
                </Badge>
              )}
              
              {/* メニューボタン */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
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
            </div>
          </div>

        {user.bio && (
          <p className="text-sm text-neutral-700 mb-4 line-clamp-3">
            {user.bio}
          </p>
        )}

        {user.tags && user.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {user.tags.slice(0, 5).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {tag.name}
              </Badge>
            ))}
            {user.tags.length > 5 && (
              <Badge variant="outline" size="sm" className="text-xs">
                +{user.tags.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button
          onClick={handleLikeClick}
          disabled={isLoading || like_status.is_matched}
          variant={like_status.i_liked ? 'secondary' : 'default'}
          className={cn(
            'flex-1',
            like_status.i_liked && 'bg-pink-100 text-pink-700 hover:bg-pink-200'
          )}
        >
          {isLoading ? (
            '送信中...'
          ) : like_status.is_matched ? (
            '✓ マッチ済み'
          ) : like_status.i_liked ? (
            '❤️ いいね済み'
          ) : (
            '❤️ いいね'
          )}
        </Button>
        
        {like_status.they_liked && !like_status.is_matched && (
          <Badge variant="secondary" size="sm" className="ml-2">
            相手からいいね
          </Badge>
        )}
      </CardFooter>
    </Card>

    {/* 通報ダイアログ */}
    <ReportDialog
      isOpen={showReportDialog}
      onClose={() => setShowReportDialog(false)}
      targetUserId={user.id}
      targetUserName={user.display_name}
    />

    {/* ブロック確認ダイアログ */}
    <BlockConfirm
      isOpen={showBlockConfirm}
      onClose={() => setShowBlockConfirm(false)}
      targetUserId={user.id}
      targetUserName={user.display_name}
    />
    </>
  )
})

