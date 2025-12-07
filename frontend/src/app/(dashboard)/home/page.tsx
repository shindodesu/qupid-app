'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { searchApi } from '@/lib/api/search'
import { DiscoverUserGridCard } from '@/components/features/DiscoverUserGridCard'
import { DiscoverFilters } from '@/components/features/DiscoverFilters'
import { PWADownloadModal } from '@/components/features/PWADownloadModal'
import { InAppPWAInstallPrompt } from '@/components/features/InAppPWAInstallPrompt'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { DiscoverFilters as DiscoverFiltersType, UserSuggestion } from '@/types/search'
import { ProfilePreviewModal, type ProfilePreviewData } from '@/components/features/profile/ProfilePreviewModal'
import { getAvatarUrl } from '@/lib/utils/image'
import { PageTransition, StaggerContainer, StaggerItem, AnimatedBackground } from '@/components/ui/PageTransition'
import { useTheme } from '@/hooks/useTheme'

export default function DiscoverPage() {
  const [processedUserIds, setProcessedUserIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [filters, setFilters] = useState<DiscoverFiltersType>({})
  const { toast, toasts, removeToast } = useToast()
  const [profilePreviewUserId, setProfilePreviewUserId] = useState<number | null>(null)
  const [profilePreviewInitial, setProfilePreviewInitial] = useState<Partial<ProfilePreviewData> | undefined>()
  const theme = useTheme()

  // おすすめユーザー取得（グリッド表示用に4人以上取得）
  const { data: suggestionsData, isLoading, refetch } = useQuery({
    queryKey: ['suggestions', filters],
    queryFn: () => {
      console.log('[Filter] API call with filters:', filters)
      return searchApi.getSuggestions(20, filters)
    },
  })

  const users = (suggestionsData?.users || []).filter(user => !processedUserIds.has(user.id))

  const handleLike = async (userId: number) => {
    try {
      const response = await searchApi.sendLike(userId)
      console.log('[Like] Response received:', response)
      
      if (response.is_match) {
        toast({
          title: "マッチしました！",
          description: "お互いにいいねを送りました。チャットを開始できます。",
          type: "success"
        })
      } else {
        toast({
          title: "いいねを送信しました",
          description: "相手からのいいねを待ちましょう。",
          type: "success"
        })
      }
      
      // 処理済みユーザーに追加
      setProcessedUserIds(prev => new Set([...prev, userId]))
      
      // ユーザーが少なくなったら再取得
      if (users.length <= 8) {
        refetch()
      }
    } catch (error: any) {
      console.error('[Like] Error sending like:', error)
      const errorMessage = error?.message || 'いいねの送信に失敗しました'
      toast({
        title: "エラーが発生しました",
        description: errorMessage,
        type: "error"
      })
    }
  }

  const handleSkip = (userId: number) => {
    // 処理済みユーザーに追加
    setProcessedUserIds(prev => new Set([...prev, userId]))
    
    // ユーザーが少なくなったら再取得
    if (users.length <= 8) {
      refetch()
    }
  }

  // 表示用のユーザー（すべて表示、縦長グリッド用）
  const displayUsers = users

  // フィルターハンドラー
  const handleFiltersChange = (newFilters: DiscoverFiltersType) => {
    console.log('[Filter] Filters changed:', newFilters)
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    console.log('[Filter] Apply button clicked, current filters:', filters)
    setShowFilters(false)
    setProcessedUserIds(new Set()) // フィルター適用時に処理済みリストをリセット
    refetch()
  }

  const handleClearFilters = () => {
    console.log('[Filter] Clear button clicked')
    setFilters({})
    setProcessedUserIds(new Set())
    refetch()
  }

  const handleImageClick = (user: UserSuggestion) => {
    const previewData: Partial<ProfilePreviewData> = {
      display_name: user.display_name,
      bio: user.bio,
      avatar_url: user.avatar_url ? getAvatarUrl(user.avatar_url) : undefined,
      faculty: user.faculty,
      grade: user.grade,
      tags: user.tags || [],
    }
    setProfilePreviewUserId(user.id)
    setProfilePreviewInitial(previewData)
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
            <div className="flex items-center justify-between">
              {/* 「探す」テキスト */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h1 className="text-3xl font-bold text-theme-gradient mb-1">
                  探す
                </h1>
                <p className="text-sm text-neutral-600">
                  新しい出会いを見つけましょう
                </p>
              </motion.div>
              
              {/* フィルターボタン */}
              <motion.button 
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: 0.4
                }}
                className="w-10 h-10 bg-theme-gradient rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all shadow-lg shadow-theme hover:shadow-xl"
                style={theme.gradientBRStyle}
                aria-label="検索フィルター"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* メインコンテンツ */}
        <div className="container mx-auto px-4 py-6 relative z-10">
          {/* インストールプロンプトバナー */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <InAppPWAInstallPrompt onOpenModal={() => setShowDownloadModal(true)} />
          </motion.div>
          
          {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-theme-primary/20 border-t-theme-primary"></div>
                <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-r-theme-secondary" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="mt-6 text-neutral-600 font-medium animate-pulse-soft">新しいユーザーを探しています...</p>
            </div>
          </div>
          ) : displayUsers.length > 0 ? (
            <div className="max-w-2xl mx-auto">
              {/* 縦長グリッドレイアウト（2列で縦にスクロール） */}
              <StaggerContainer className="grid grid-cols-2 gap-6 pb-6" staggerDelay={0.1}>
                {displayUsers.map((user, index) => (
                  <StaggerItem key={user.id}>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <DiscoverUserGridCard
                        user={user}
                        onLike={() => handleLike(user.id)}
                        onSkip={() => handleSkip(user.id)}
                        onImageClick={() => handleImageClick(user)}
                      />
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            
            {/* ユーザーが少ない場合のメッセージ */}
            {users.length <= 8 && (
              <div className="mt-6 text-center pb-6">
                <p className="text-neutral-600 text-sm">
                  新しいユーザーを読み込んでいます...
                </p>
              </div>
            )}
          </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center py-16 max-w-md mx-auto px-4"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
                className="text-6xl mb-6"
              >
                💔
              </motion.div>
              <h2 className="text-2xl font-bold text-theme-gradient mb-3">
                すべて見ました
              </h2>
              <p className="text-neutral-600 mb-8 leading-relaxed">
                今は表示できるユーザーがいません。<br />
                後でもう一度チェックしてみてください！
              </p>
              <motion.button 
                onClick={async () => {
                  setProcessedUserIds(new Set())
                  try {
                    await refetch()
                  } catch (error) {
                    console.error('更新エラー:', error)
                  }
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-theme-gradient text-white rounded-full hover:opacity-90 transition-all duration-300 shadow-2xl shadow-theme-lg hover:shadow-theme font-semibold text-lg relative overflow-hidden group"
                style={{
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary}, ${theme.accent})`,
                }}
              >
                <span className="relative z-10">更新する</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </motion.button>
            </motion.div>
          )}
        </div>

      {/* フィルターオーバーレイ */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full max-h-[80vh] overflow-y-auto">
            <DiscoverFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* ダウンロードモーダル */}
        <PWADownloadModal 
          isOpen={showDownloadModal} 
          onClose={() => setShowDownloadModal(false)} 
        />

        {/* プロフィールプレビューモーダル */}
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
