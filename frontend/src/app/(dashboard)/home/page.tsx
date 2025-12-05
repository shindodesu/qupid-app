'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { searchApi } from '@/lib/api/search'
import { DiscoverUserCard } from '@/components/features/DiscoverUserCard'
import { DiscoverFilters } from '@/components/features/DiscoverFilters'
import { PWADownloadModal } from '@/components/features/PWADownloadModal'
import { InAppPWAInstallPrompt } from '@/components/features/InAppPWAInstallPrompt'
import { ProfilePreviewModal } from '@/components/features/profile/ProfilePreviewModal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { DiscoverFilters as DiscoverFiltersType } from '@/types/search'

export default function DiscoverPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [previewUserId, setPreviewUserId] = useState<number | null>(null)
  const [filters, setFilters] = useState<DiscoverFiltersType>({})
  const { toast, toasts, removeToast } = useToast()

  // おすすめユーザー取得（より多くのユーザーを取得）
  const { data: suggestionsData, isLoading, refetch } = useQuery({
    queryKey: ['suggestions', filters],
    queryFn: () => {
      console.log('[Filter] API call with filters:', filters)
      return searchApi.getSuggestions(20, filters)
    },
  })

  const users = suggestionsData?.users || []

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
      
      // ユーザーリストから削除（オプション：再取得）
      refetch()
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

  const handleSkip = async (userId: number) => {
    // スキップ処理（必要に応じてAPI呼び出しを追加）
    // 現在は単にリストから除外する想定
    refetch()
  }

  // フィルターハンドラー
  const handleFiltersChange = (newFilters: DiscoverFiltersType) => {
    console.log('[Filter] Filters changed:', newFilters)
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    console.log('[Filter] Apply button clicked, current filters:', filters)
    setShowFilters(false)
    // React QueryはqueryKeyにfiltersが含まれているので、
    // filtersが変更されると自動的に再フェッチされる
    // ただし、状態更新が非同期なので、useEffectで処理する
  }

  const handleClearFilters = () => {
    console.log('[Filter] Clear button clicked')
    setFilters({})
  }

  // filtersが変更されたときにログを出力（デバッグ用）
  useEffect(() => {
    console.log('[Filter] Filters state updated:', filters)
  }, [filters])

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">探す</h1>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-4">
        {/* インストールプロンプトバナー */}
        <div className="mb-4">
          <InAppPWAInstallPrompt onOpenModal={() => setShowDownloadModal(true)} />
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              <p className="mt-4 text-neutral-600">新しいユーザーを探しています...</p>
            </div>
          </div>
        ) : users.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {users.map((user) => (
              <DiscoverUserCard
                key={user.id}
                user={user}
                onLike={() => handleLike(user.id)}
                onSkip={() => handleSkip(user.id)}
                onCardClick={() => setPreviewUserId(user.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">すべて見ました</h2>
            <p className="text-neutral-600 mb-6">
              今は表示できるユーザーがいません。<br />
              後でもう一度チェックしてみてください！
            </p>
            <button 
              onClick={async () => {
                try {
                  await refetch()
                } catch (error) {
                  console.error('更新エラー:', error)
                }
              }}
              className="px-6 py-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
            >
              更新する
            </button>
          </div>
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
        userId={previewUserId}
        isOpen={previewUserId !== null}
        onClose={() => setPreviewUserId(null)}
        initialData={previewUserId ? users.find(u => u.id === previewUserId) ? {
          display_name: users.find(u => u.id === previewUserId)!.display_name,
          bio: users.find(u => u.id === previewUserId)!.bio,
          faculty: users.find(u => u.id === previewUserId)!.faculty,
          grade: users.find(u => u.id === previewUserId)!.grade,
          tags: users.find(u => u.id === previewUserId)!.tags,
        } : undefined : undefined}
      />
    </div>
  )
}

