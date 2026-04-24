'use client'

import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { searchApi } from '@/lib/api/search'
import { chatApi } from '@/lib/api/chat'
import { getAvatarUrl } from '@/lib/utils/image'
import { ReportDialog, BlockConfirm } from '@/components/features/safety'
import { ProfilePreviewModal, type ProfilePreviewData } from '@/components/features/profile/ProfilePreviewModal'
import { Badge } from '@/components/ui/Badge'
import type { TagInfo } from '@/types/search'
import { PageTransition } from '@/components/ui/PageTransition'
import { useTheme } from '@/hooks/useTheme'

export default function LikesPage() {
  const [reportUserId, setReportUserId] = useState<number | null>(null)
  const [reportUserName, setReportUserName] = useState<string>('')
  const [blockUserId, setBlockUserId] = useState<number | null>(null)
  const [blockUserName, setBlockUserName] = useState<string>('')
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [profilePreviewUserId, setProfilePreviewUserId] = useState<number | null>(null)
  const [profilePreviewInitial, setProfilePreviewInitial] = useState<Partial<ProfilePreviewData> | undefined>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [showMatchCelebration, setShowMatchCelebration] = useState(false)
  const [matchConversationId, setMatchConversationId] = useState<number | null>(null)
  
  const queryClient = useQueryClient()
  const router = useRouter()
  const theme = useTheme()

  // 受け取ったいいね一覧取得
  const { data: likesData, isLoading } = useQuery({
    queryKey: ['received-likes'],
    queryFn: () => searchApi.getReceivedLikes(),
  })

  // いいねを返すミューテーション
  const likeMutation = useMutation({
    mutationFn: (userId: number) => searchApi.sendLike(userId),
    onSuccess: () => {
      // いいね一覧を再取得
      queryClient.invalidateQueries({ queryKey: ['received-likes'] })
    },
  })

  // チャットを開始するミューテーション
  const startChatMutation = useMutation({
    mutationFn: (userId: number) => chatApi.createConversation(userId),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      router.push(`/chat/${conversation.id}`)
    },
    onError: (error: any) => {
      console.error('Failed to start chat:', error)
      alert(
        error?.message ||
          'チャットを開始できませんでした。時間を置いてもう一度お試しください。'
      )
    },
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

  const handleLikeBack = async (userId: number) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setSwipeDirection('right')
    
    try {
      const result = await likeMutation.mutateAsync(userId)
      
      // アニメーション完了後に次のユーザーに進む
      setTimeout(() => {
        if (likesData && likesData.likes && currentIndex < likesData.likes.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          queryClient.invalidateQueries({ queryKey: ['received-likes'] })
          setCurrentIndex(0)
        }
        setIsAnimating(false)
        setSwipeDirection(null)
      }, 400)
      
      if (result.is_match) {
        const conversationId = result.match?.conversation_id
        console.log('Match result:', { match: result.match, conversationId })
        setMatchConversationId(conversationId || null)
        setShowMatchCelebration(true)
        // conversation_idがない場合は自動で閉じない
        if (conversationId) {
          setTimeout(() => setShowMatchCelebration(false), 5000)
        } else {
          setTimeout(() => setShowMatchCelebration(false), 3000)
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      // 既にいいね済みの場合は実際には送信できているため、成功扱いにする（二重送信・表示の遅延などで400になる場合）
      const isAlreadyLiked =
        message.includes('already liked') ||
        message.includes('既にいいね')
      if (isAlreadyLiked) {
        queryClient.invalidateQueries({ queryKey: ['received-likes'] })
        queryClient.invalidateQueries({ queryKey: ['matches'] })
        if (likesData?.likes && currentIndex < likesData.likes.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          setCurrentIndex(0)
        }
        setIsAnimating(false)
        setSwipeDirection(null)
        return
      }
      console.error('Failed to send like:', error)
      alert('いいねの送信に失敗しました')
      setIsAnimating(false)
      setSwipeDirection(null)
    }
  }

  // スキップ送信ミューテーション
  const skipMutation = useMutation({
    mutationFn: (userId: number) => searchApi.sendSkip(userId),
    onSuccess: () => {
      // いいね一覧を再取得（スキップしたユーザーが除外される）
      queryClient.invalidateQueries({ queryKey: ['received-likes'] })
    },
    onError: (error: any) => {
      console.error('Failed to send skip:', error)
      alert('スキップの送信に失敗しました')
    },
  })

  const handleSkip = async () => {
    if (isAnimating || !currentUser) return
    
    setIsAnimating(true)
    setSwipeDirection('left')
    
    try {
      // スキップを送信
      await skipMutation.mutateAsync(currentUser.user.id)
      
      // アニメーション完了後に次のユーザーに進む
      setTimeout(() => {
        if (likesData && likesData.likes && currentIndex < likesData.likes.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          queryClient.invalidateQueries({ queryKey: ['received-likes'] })
          setCurrentIndex(0)
        }
        setIsAnimating(false)
        setSwipeDirection(null)
      }, 400)
    } catch (error) {
      setIsAnimating(false)
      setSwipeDirection(null)
    }
  }

  // 現在表示中のユーザー
  const currentUser = likesData && likesData.likes && likesData.likes.length > 0 
    ? likesData.likes[currentIndex] 
    : null

  // プロフィールプレビュー用のデータ準備
  const previewData = currentUser ? {
    display_name: currentUser.user.display_name,
    bio: currentUser.user.bio,
    avatar_url: currentUser.user.avatar_url ? getAvatarUrl(currentUser.user.avatar_url) : undefined,
    campus: currentUser.user.campus,
    faculty: currentUser.user.faculty,
    grade: currentUser.user.grade,
    sexuality: currentUser.user.sexuality,
    looking_for: currentUser.user.looking_for,
    tags: currentUser.user.tags || [],
  } : undefined

  const openProfilePreview = () => {
    if (currentUser) {
      setProfilePreviewUserId(currentUser.user.id)
      setProfilePreviewInitial(previewData)
    }
  }

  return (
    <PageTransition variant="bounce">
      <div className="min-h-screen bg-theme-page relative overflow-hidden">
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
                className="flex-1"
              >
                <h1 className="text-3xl font-bold text-theme-primary mb-1">
                  いいね
                </h1>
                {likesData && likesData.likes && likesData.likes.length > 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-neutral-600"
                  >
                    お相手からのいいね! {likesData.total && likesData.total >= 100 ? '99+' : (likesData.total || likesData.likes.length)}件
                  </motion.p>
                )}
              </motion.div>
              {/* スキップ一覧への遷移ボタン */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-2"
              >
                <Link href="/skips">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-xs font-medium bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-all duration-300 border border-neutral-300"
                  >
                    スキップ一覧
                  </motion.button>
                </Link>
                {/* 通知バッジ（モバイル用） */}
                {likesData && likesData.likes && likesData.likes.length > 0 ? (
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: 0.5
                    }}
                    className="md:hidden inline-block px-3 py-1.5 bg-theme-primary border border-theme-primary/30 rounded-lg shadow-lg shadow-theme"
                  >
                    <span className="text-white text-xs font-medium">
                      {likesData.total && likesData.total >= 100 ? '99+' : (likesData.total || likesData.likes.length)}
                    </span>
                  </motion.div>
                ) : null}
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
      ) : currentUser ? (
        <div className="container mx-auto px-4 py-4 max-w-2xl relative z-10">
          {/* マッチ成功時の祝福アニメーション */}
          <AnimatePresence>
            {showMatchCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                onClick={(e) => {
                  // 背景クリックで閉じる（オプション）
                  if (e.target === e.currentTarget) {
                    setShowMatchCelebration(false)
                  }
                }}
              >
                <div className="relative">
                  {/* 背景の光るエフェクト */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 2, opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{
                      background: theme.primary,
                    }}
                  />
                  {/* メインメッセージ */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="relative rounded-3xl p-12 shadow-2xl pointer-events-auto"
                    style={{
                      background: theme.primary,
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                      className="text-8xl mb-4 text-center"
                    >
                      🎉
                    </motion.div>
                    <h2 className="text-4xl font-bold text-white text-center mb-2">マッチしました！</h2>
                    <p className="text-white/90 text-lg text-center mb-6">トークルームで会話を始めましょう</p>
                    {matchConversationId ? (
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Button clicked, conversationId:', matchConversationId)
                          setShowMatchCelebration(false)
                          if (matchConversationId) {
                            // 少し遅延を入れてモーダルが閉じるのを待つ
                            setTimeout(() => {
                              router.push(`/chat/${matchConversationId}`)
                              // フォールバック: router.pushが動作しない場合
                              setTimeout(() => {
                                if (window.location.pathname !== `/chat/${matchConversationId}`) {
                                  window.location.href = `/chat/${matchConversationId}`
                                }
                              }, 100)
                            }, 100)
                          }
                        }}
                        className="w-full py-4 px-8 bg-white text-theme-primary rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-50 relative"
                        type="button"
                      >
                        トークルームを開く
                      </motion.button>
                    ) : currentUser ? (
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowMatchCelebration(false)
                          try {
                            const conversation = await startChatMutation.mutateAsync(currentUser.user.id)
                            router.push(`/chat/${conversation.id}`)
                          } catch (error) {
                            console.error('Failed to create conversation:', error)
                            alert('トークルームの作成に失敗しました')
                          }
                        }}
                        disabled={startChatMutation.isPending}
                        className="w-full py-4 px-8 bg-white text-theme-primary rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-50 relative disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                      >
                        {startChatMutation.isPending ? '作成中...' : 'トークルームを作成'}
                      </motion.button>
                    ) : (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-white/80 text-sm text-center"
                      >
                        トークルームの準備中...
                      </motion.p>
                    )}
                  </motion.div>
                  {/* キラキラエフェクト */}
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                      animate={{
                        x: Math.cos((i * 360) / 20) * 200,
                        y: Math.sin((i * 360) / 20) * 200,
                        opacity: [1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{ duration: 2, delay: i * 0.1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="text-2xl">✨</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* プロフィールカード */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentUser.user.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                x: swipeDirection === 'left' ? -500 : swipeDirection === 'right' ? 500 : 0,
                rotate: swipeDirection === 'left' ? -30 : swipeDirection === 'right' ? 30 : 0,
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.8,
                x: swipeDirection === 'left' ? -500 : 500,
                rotate: swipeDirection === 'left' ? -30 : 30,
              }}
              transition={{ 
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="bg-theme-card rounded-3xl mb-8 shadow-2xl shadow-theme border border-theme-primary/20 overflow-hidden relative group hover:shadow-theme-lg transition-all duration-500 backdrop-blur-sm"
            >
              {/* オーバーレイ */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                style={{
                  background: `${theme.primary}08`,
                }}
              ></div>
              {/* 光るエフェクト */}
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10"></div>
              
              {/* プロフィール画像 */}
              <div 
                className="relative aspect-square overflow-hidden cursor-pointer"
                onClick={openProfilePreview}
              >
                {currentUser.user.avatar_url ? (
                  <Image
                    src={getAvatarUrl(currentUser.user.avatar_url, true) || '/initial_icon.svg'}
                    alt={currentUser.user.display_name}
                    fill
                    unoptimized
                    className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      console.error('[MatchesPage] Image load error:', {
                        src: getAvatarUrl(currentUser.user.avatar_url),
                        avatarUrl: currentUser.user.avatar_url,
                      })
                      // エラー時はデフォルト画像にフォールバック
                      e.currentTarget.src = '/initial_icon.svg'
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    {/* 頭部（大きな円） */}
                    <div className="w-32 h-32 bg-neutral-300 rounded-full mb-4"></div>
                    {/* 肩部（大きなU字型） */}
                    <div className="w-64 h-32 bg-neutral-300 rounded-t-full"></div>
                  </div>
                )}
                
                {/* ユーザー情報（画像の上に重ねて表示） */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">
                        {currentUser.user.display_name}
                      </h2>
                      {(currentUser.user.faculty || currentUser.user.grade) && (
                        <p className="text-white/90 text-sm drop-shadow-md">
                          {[currentUser.user.faculty, currentUser.user.grade].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* タグ */}
                    {currentUser.user.tags && currentUser.user.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {currentUser.user.tags.slice(0, 3).map((tag: TagInfo) => (
                          <Badge 
                            key={tag.id} 
                            variant="outline" 
                            className="bg-white/20 border-white/30 text-white backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* バイオ */}
                    {currentUser.user.bio && (
                      <p className="text-white/95 text-sm mb-3 line-clamp-2 drop-shadow-md">
                        {currentUser.user.bio}
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* アクションボタン */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-6 md:gap-8 mb-8"
          >
            {/* スキップボタン */}
            <motion.button
              onClick={handleSkip}
              disabled={isAnimating}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center gap-2 w-20 h-20 md:w-28 md:h-28 bg-neutral-200 border-2 border-white/80 rounded-full hover:bg-neutral-300 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {/* リップル効果 */}
              <span className="absolute inset-0 rounded-full bg-white/30 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
              {/* 曲がった矢印アイコン */}
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-xs font-medium text-neutral-900">スキップ</span>
            </motion.button>

            {/* ありがとうボタン */}
            <motion.button
              onClick={() => handleLikeBack(currentUser.user.id)}
              disabled={likeMutation.isPending || isAnimating}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center gap-2 w-24 h-24 md:w-32 md:h-32 border-2 border-white/80 rounded-full hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative shadow-2xl shadow-theme-lg hover:shadow-theme overflow-hidden group"
              style={{
                background: theme.primary,
              }}
            >
              {/* リップル効果 */}
              <span className="absolute inset-0 rounded-full bg-white/40 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
              {/* 光るエフェクト */}
              <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {/* キラキラした手のアイコン（親指を立てた手） */}
              <motion.div 
                className="relative"
                animate={likeMutation.isPending ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: likeMutation.isPending ? Infinity : 0 }}
              >
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
                {/* キラキラエフェクト（星） */}
                <motion.svg 
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-300" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </motion.svg>
                <motion.svg 
                  className="absolute -bottom-0.5 -left-0.5 w-2 h-2 md:w-2.5 md:h-2.5 text-yellow-300" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: [360, 180, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </motion.svg>
                <motion.svg 
                  className="absolute top-1/2 -right-2 w-2 h-2 text-yellow-300" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: [0, -180, -360], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </motion.svg>
              </motion.div>
              <span className="text-xs font-medium text-white">ありがとう!</span>
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh] relative z-10">
          <div className="text-center max-w-md mx-auto px-4 animate-fade-in">
            <div className="text-8xl mb-8 animate-bounce" style={{ animationDuration: '2s' }}>💕</div>
            <h2 className="text-3xl font-bold text-theme-primary mb-4 animate-scale-in">
              まだいいねがありません
            </h2>
            <p className="text-neutral-600 mb-10 leading-relaxed text-lg">
              ユーザーを探していいねを送ってみましょう
            </p>
            <Link href="/home">
              <button 
                className="px-10 py-4 text-white rounded-full hover:opacity-90 transition-all duration-300 shadow-2xl shadow-theme-lg hover:shadow-theme hover:scale-110 active:scale-95 font-semibold text-lg relative overflow-hidden group"
                style={{
                  background: theme.primary,
                }}
              >
                <span className="relative z-10">ユーザーを探す</span>
                <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
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

