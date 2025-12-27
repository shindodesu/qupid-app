'use client'

import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { searchApi } from '@/lib/api/search'
import { getAvatarUrl } from '@/lib/utils/image'
import { ProfilePreviewModal, type ProfilePreviewData } from '@/components/features/profile/ProfilePreviewModal'
import { Badge } from '@/components/ui/Badge'
import type { TagInfo } from '@/types/search'
import { PageTransition, AnimatedBackground } from '@/components/ui/PageTransition'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'

export default function SkipsPage() {
  const [profilePreviewUserId, setProfilePreviewUserId] = useState<number | null>(null)
  const [profilePreviewInitial, setProfilePreviewInitial] = useState<Partial<ProfilePreviewData> | undefined>()
  
  const queryClient = useQueryClient()
  const theme = useTheme()
  const { toast } = useToast()

  // スキップ一覧取得
  const { data: skipsData, isLoading } = useQuery({
    queryKey: ['skips'],
    queryFn: () => searchApi.getSkips(),
  })

  // スキップ取り消しミューテーション
  const removeSkipMutation = useMutation({
    mutationFn: (userId: number) => searchApi.removeSkip(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skips'] })
      toast({
        title: "スキップを取り消しました",
        type: "success"
      })
    },
    onError: (error: any) => {
      toast({
        title: "エラーが発生しました",
        description: error?.message || 'スキップの取り消しに失敗しました',
        type: "error"
      })
    },
  })

  const openProfilePreview = (skip: any) => {
    const previewData: Partial<ProfilePreviewData> = {
      display_name: skip.skipped_user.display_name,
      bio: skip.skipped_user.bio,
      avatar_url: skip.skipped_user.avatar_url ? getAvatarUrl(skip.skipped_user.avatar_url) : undefined,
      campus: skip.skipped_user.campus,
      faculty: skip.skipped_user.faculty,
      grade: skip.skipped_user.grade,
      sexuality: skip.skipped_user.sexuality,
      looking_for: skip.skipped_user.looking_for,
      tags: skip.skipped_user.tags || [],
    }
    setProfilePreviewUserId(skip.skipped_user.id)
    setProfilePreviewInitial(previewData)
  }

  const handleRemoveSkip = (userId: number) => {
    if (confirm('スキップを取り消しますか？')) {
      removeSkipMutation.mutate(userId)
    }
  }

  return (
    <PageTransition variant="bounce">
      <div className="min-h-screen bg-theme-page relative overflow-hidden">
        {/* 装飾的な背景要素 */}
        <AnimatedBackground variant="bubbles" />
        
        {/* ヘッダー */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-theme-header border-b border-theme-primary/20 sticky top-0 z-10 backdrop-blur-md shadow-sm"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h1 className="text-3xl font-bold text-theme-primary mb-1">
                  スキップ一覧
                </h1>
                {skipsData && skipsData.skips && skipsData.skips.length > 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-neutral-600"
                  >
                    スキップしたユーザー: {skipsData.skips.length}人
                  </motion.p>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* メインコンテンツ */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh] relative z-10">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-theme-primary/20 border-t-theme-primary"></div>
                <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-r-theme-secondary" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="mt-6 text-neutral-600 font-medium animate-pulse-soft">読み込み中...</p>
            </div>
          </div>
        ) : skipsData && skipsData.skips && skipsData.skips.length > 0 ? (
          <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skipsData.skips.map((skip: any) => (
                <motion.div
                  key={skip.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-theme-card rounded-2xl shadow-lg border border-theme-primary/20 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* プロフィール画像 */}
                  <div className="relative aspect-square overflow-hidden">
                    {skip.skipped_user.avatar_url ? (
                      <Image
                        src={getAvatarUrl(skip.skipped_user.avatar_url) || '/icon.png'}
                        alt={skip.skipped_user.display_name}
                        fill
                        unoptimized
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/initial_icon.png'
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-neutral-200">
                        <div className="w-24 h-24 bg-neutral-300 rounded-full mb-4"></div>
                        <div className="w-48 h-24 bg-neutral-300 rounded-t-full"></div>
                      </div>
                    )}
                    
                    {/* オーバーレイ */}
                    <div className="absolute inset-0 bg-black/40"></div>
                    
                    {/* ユーザー情報 */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                      <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                        {skip.skipped_user.display_name}
                      </h3>
                      {(skip.skipped_user.faculty || skip.skipped_user.grade) && (
                        <p className="text-white/90 text-xs drop-shadow-md">
                          {[skip.skipped_user.faculty, skip.skipped_user.grade].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* コンテンツ */}
                  <div className="p-4">
                    {/* タグ */}
                    {skip.skipped_user.tags && skip.skipped_user.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {skip.skipped_user.tags.slice(0, 3).map((tag: TagInfo) => (
                          <Badge 
                            key={tag.id} 
                            variant="outline" 
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* バイオ */}
                    {skip.skipped_user.bio && (
                      <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                        {skip.skipped_user.bio}
                      </p>
                    )}

                    {/* アクションボタン */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openProfilePreview(skip)}
                        className="flex-1 px-3 py-2 text-sm bg-theme-primary text-white rounded-lg hover:opacity-90 transition-all duration-300"
                        style={{ background: theme.primary }}
                      >
                        詳細を見る
                      </button>
                      <button
                        onClick={() => handleRemoveSkip(skip.skipped_user.id)}
                        disabled={removeSkipMutation.isPending}
                        className="px-3 py-2 text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-all duration-300 disabled:opacity-50"
                      >
                        取り消し
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh] relative z-10">
            <div className="text-center max-w-md mx-auto px-4 animate-fade-in">
              <div className="text-8xl mb-8 animate-bounce" style={{ animationDuration: '2s' }}>⏭️</div>
              <h2 className="text-3xl font-bold text-theme-primary mb-4 animate-scale-in">
                スキップしたユーザーはいません
              </h2>
              <p className="text-neutral-600 mb-10 leading-relaxed text-lg">
                スキップしたユーザーはここに表示されます
              </p>
              <Link href="/matches">
                <button 
                  className="px-10 py-4 text-white rounded-full hover:opacity-90 transition-all duration-300 shadow-2xl shadow-theme-lg hover:shadow-theme hover:scale-110 active:scale-95 font-semibold text-lg relative overflow-hidden group"
                  style={{
                    background: theme.primary,
                  }}
                >
                  <span className="relative z-10">いいね画面に戻る</span>
                  <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </Link>
            </div>
          </div>
        )}

        <ProfilePreviewModal
          userId={profilePreviewUserId}
          isOpen={profilePreviewUserId !== null}
          onClose={() => {
            setProfilePreviewUserId(null)
            setProfilePreviewInitial(undefined)
          }}
          initialData={
            profilePreviewUserId && profilePreviewInitial
              ? { id: profilePreviewUserId, ...profilePreviewInitial }
              : undefined
          }
        />
      </div>
    </PageTransition>
  )
}

