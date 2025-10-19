'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { searchApi } from '@/lib/api/search'
import { DiscoverUserCard } from '@/components/features/DiscoverUserCard'
import { DiscoverFilters } from '@/components/features/DiscoverFilters'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { useFilter } from '@/components/providers/FilterProvider'

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { toast, toasts, removeToast } = useToast()
  const { showFilters, setShowFilters, filters, setFilters, onApplyFilters, onClearFilters } = useFilter()

  // おすすめユーザー取得（より多くのユーザーを取得）
  const { data: suggestionsData, isLoading, refetch } = useQuery({
    queryKey: ['suggestions', filters],
    queryFn: () => searchApi.getSuggestions(20, filters),
  })

  const users = suggestionsData?.users || []

  const handleLike = async (userId: number) => {
    try {
      const response = await searchApi.sendLike(userId)
      
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
      
      // 次のユーザーに移動
      setCurrentIndex(prev => prev + 1)
      
      // ユーザーが少なくなったら再取得
      if (currentIndex >= users.length - 3) {
        refetch()
      }
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "いいねの送信に失敗しました。",
        type: "error"
      })
    }
  }

  const handleSkip = () => {
    // 次のユーザーに移動
    setCurrentIndex(prev => prev + 1)
    
    // ユーザーが少なくなったら再取得
    if (currentIndex >= users.length - 3) {
      refetch()
    }
  }

  const currentUser = users[currentIndex]

  // フィルターハンドラー
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onApplyFilters()
    setCurrentIndex(0) // フィルター適用時に最初のユーザーに戻る
    refetch()
  }

  const handleClearFilters = () => {
    onClearFilters()
    setCurrentIndex(0)
    refetch()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold text-neutral-900">Discover</h1>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              <p className="mt-4 text-neutral-600">新しいユーザーを探しています...</p>
            </div>
          </div>
        ) : currentUser ? (
          <div className="max-w-sm mx-auto">
            <DiscoverUserCard
              user={currentUser}
              onLike={() => handleLike(currentUser.id)}
              onSkip={handleSkip}
            />
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
              onClick={() => {
                setCurrentIndex(0)
                refetch()
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
    </div>
  )
}

