'use client'

import { useState } from 'react'
import { UserSuggestion } from '@/types/search'
import { Badge } from '@/components/ui/Badge'

interface DiscoverUserCardProps {
  user: UserSuggestion
  onLike: () => void
  onSkip: () => void
}

export function DiscoverUserCard({ user, onLike, onSkip }: DiscoverUserCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [action, setAction] = useState<'like' | 'skip' | null>(null)

  const handleAction = (type: 'like' | 'skip') => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setAction(type)
    
    setTimeout(() => {
      if (type === 'like') {
        onLike()
      } else {
        onSkip()
      }
      setIsAnimating(false)
      setAction(null)
    }, 300)
  }

  return (
    <div className="relative">
      {/* メインカード */}
      <div 
        className={`
          relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg
          transition-all duration-300 ease-out
          ${isAnimating ? (action === 'like' ? 'transform rotate-12 scale-105' : 'transform -rotate-12 scale-105') : ''}
        `}
      >
        {/* 背景画像（プレースホルダー） */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600">
          {/* ユーザーのプロフィール画像がない場合のプレースホルダー */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-8xl font-bold opacity-20">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* ユーザー情報 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold">{user.display_name}</h2>
              {(user.faculty || user.grade) && (
                <p className="text-white/80 text-sm">
                  {[user.faculty, user.grade].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* タグ */}
          {user.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {user.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="outline" 
                  className="bg-white/20 border-white/30 text-white backdrop-blur-sm"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* バイオ */}
          {user.bio && (
            <p className="text-white/90 text-sm mb-4 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* マッチ度表示 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-white/20 rounded-full h-2">
              <div 
                className="bg-pink-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${user.match_score * 100}%` }}
              />
            </div>
            <span className="text-white/80 text-xs font-medium">
              {Math.round(user.match_score * 100)}% マッチ
            </span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-4">
          {/* スキップボタン */}
          <button
            onClick={() => handleAction('skip')}
            disabled={isAnimating}
            className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* いいねボタン */}
          <button
            onClick={() => handleAction('like')}
            disabled={isAnimating}
            className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-white hover:bg-pink-600 transition-colors disabled:opacity-50 shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* アクション時のアニメーション */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className={`
              text-6xl font-bold transition-all duration-300
              ${action === 'like' ? 'text-green-500' : 'text-red-500'}
            `}
          >
            {action === 'like' ? '💕' : '❌'}
          </div>
        </div>
      )}
    </div>
  )
}
