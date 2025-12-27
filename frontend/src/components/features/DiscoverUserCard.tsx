'use client'

import { useState } from 'react'
import { UserSuggestion } from '@/types/search'
import { getAvatarUrl } from '@/lib/utils/image'

interface DiscoverUserCardProps {
  user: UserSuggestion
  onLike: () => void
  onSkip: () => void
  onCardClick?: () => void
}

export function DiscoverUserCard({ user, onLike, onSkip, onCardClick }: DiscoverUserCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [action, setAction] = useState<'like' | 'skip' | null>(null)

  const handleAction = (type: 'like' | 'skip', e: React.MouseEvent) => {
    e.stopPropagation() // カードクリックイベントを防ぐ
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

  // 年齢計算（birthdayがあれば計算、なければ表示しない）
  const calculateAge = (birthday?: string): number | null => {
    if (!birthday) return null
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // アバター画像URL（デフォルト画像を使用）
  const avatarUrl = getAvatarUrl((user as any).avatar_url, true)

  return (
    <div className="relative">
      {/* メインカード */}
      <div 
        className={`
          relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg
          transition-all duration-300 ease-out
          ${isAnimating ? (action === 'like' ? 'transform rotate-12 scale-105' : 'transform -rotate-12 scale-105') : ''}
          ${onCardClick ? 'cursor-pointer' : ''}
        `}
        onClick={(e) => {
          // ボタンクリック時はカードクリックを無視
          if ((e.target as HTMLElement).closest('button')) {
            return
          }
          onCardClick?.()
        }}
      >
        {/* 背景画像 */}
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={user.display_name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // 画像読み込みエラー時はデフォルト画像にフォールバック
              e.currentTarget.src = '/initial_icon.png'
            }}
          />
        )}

        {/* グラデーションオーバーレイ（下部のみ） */}
        <div className="absolute inset-0 bg-black/30" />

        {/* ユーザー情報（左下） */}
        <div className="absolute bottom-16 left-4 right-4 text-white">
          <h2 className="text-lg font-bold mb-0.5">
            {user.display_name}
            {(user as any).birthday && calculateAge((user as any).birthday) !== null && (
              <span className="ml-1 text-base font-normal">, {calculateAge((user as any).birthday)}</span>
            )}
          </h2>
        </div>

        {/* アクションボタン（下部中央） */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
          {/* スキップボタン */}
          <button
            onClick={(e) => handleAction('skip', e)}
            disabled={isAnimating}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50 border border-white/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* いいねボタンまたはサムズアップボタン */}
          {user.has_received_like ? (
            <button
              onClick={(e) => handleAction('like', e)}
              disabled={isAnimating}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50 border border-white/30"
              aria-label="ありがとう"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={(e) => handleAction('like', e)}
              disabled={isAnimating}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50 border border-white/30"
              aria-label="いいね"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* アクション時のアニメーション */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div 
            className={`
              text-5xl font-bold transition-all duration-300
              ${action === 'like' ? 'text-pink-500' : 'text-red-500'}
            `}
          >
            {action === 'like' ? '❤️' : '❌'}
          </div>
        </div>
      )}
    </div>
  )
}
