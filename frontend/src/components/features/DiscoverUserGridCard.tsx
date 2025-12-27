'use client'

import { useState } from 'react'
import { UserSuggestion } from '@/types/search'
import Image from 'next/image'
import { useTheme } from '@/hooks/useTheme'
import { getAvatarUrl } from '@/lib/utils/image'

interface DiscoverUserGridCardProps {
  user: UserSuggestion
  onLike: () => void
  onSkip: () => void
  onImageClick?: () => void
}

export function DiscoverUserGridCard({ user, onLike, onSkip, onImageClick }: DiscoverUserGridCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [action, setAction] = useState<'like' | 'skip' | null>(null)
  const theme = useTheme()

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
    <div 
      className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl shadow-theme border border-theme-primary/15 group hover:shadow-2xl hover:shadow-theme-lg transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
      style={{
        background: `rgba(255, 255, 255, 0.9)`,
      }}
    >
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${theme.primary}1A`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      ></div>
      {/* 光るエフェクト */}
      <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      {/* プロフィール画像またはシルエット */}
      <div 
        className="absolute inset-0 flex items-center justify-center pt-8 z-0 cursor-pointer"
        onClick={(e) => {
          // ハートボタンのクリックイベントを防ぐ
          if ((e.target as HTMLElement).closest('button')) return
          onImageClick?.()
        }}
      >
        {user.avatar_url ? (
          <Image
            src={getAvatarUrl(user.avatar_url) || '/initial_icon.png'}
            alt={user.display_name}
            fill
            unoptimized
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              console.error('[DiscoverUserGridCard] Image load error:', {
                src: getAvatarUrl(user.avatar_url),
                avatarUrl: user.avatar_url,
              })
              // エラー時はデフォルト画像にフォールバック
              e.currentTarget.src = '/initial_icon.png'
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            {/* 頭部（大きな円） */}
            <div className="w-20 h-20 bg-neutral-300 rounded-full mb-2"></div>
            {/* 肩部（大きなU字型） */}
            <div className="w-32 h-16 bg-neutral-300 rounded-t-full"></div>
          </div>
        )}
      </div>

      {/* ユーザーID */}
      <div className="absolute bottom-12 left-0 right-0 px-4 z-10">
        <h3 
          className="text-white text-sm font-bold text-center drop-shadow-lg px-3 py-1 rounded-full backdrop-blur-sm transition-all duration-300"
          style={{
            background: `${theme.primary}CC`,
          }}
        >
          {user.display_name}
        </h3>
      </div>

      {/* ハートアイコンボタンまたはサムズアップボタン（中央下部） */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        {user.has_received_like ? (
          <button
            onClick={() => handleAction('like')}
            disabled={isAnimating}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-all duration-300 disabled:opacity-50 shadow-xl shadow-theme hover:shadow-2xl hover:shadow-theme-lg hover:scale-125 active:scale-95 relative overflow-hidden group"
            style={{
              background: theme.primary,
            }}
            aria-label="ありがとう"
          >
            {/* リップル効果 */}
            <span className="absolute inset-0 rounded-full bg-white/40 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={() => handleAction('like')}
            disabled={isAnimating}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-all duration-300 disabled:opacity-50 shadow-xl shadow-theme hover:shadow-2xl hover:shadow-theme-lg hover:scale-125 active:scale-95 relative overflow-hidden group"
            style={{
              background: theme.primary,
            }}
            aria-label="いいね"
          >
            {/* リップル効果 */}
            <span className="absolute inset-0 rounded-full bg-white/40 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        )}
      </div>

      {/* アクション時のアニメーション */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div 
            className={`
              text-6xl font-bold transition-all duration-500 animate-scale-in drop-shadow-2xl
              ${action === 'like' ? 'text-theme-primary' : 'text-red-500'}
            `}
            style={{ 
              animation: 'scale-in 0.3s ease-out, pulse-soft 0.5s ease-in-out 0.3s'
            }}
          >
            {action === 'like' ? '💕' : '❌'}
          </div>
          {/* パーティクル効果 */}
          {action === 'like' && (
            <>
              <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.primary, animationDelay: '0.1s' }}></div>
              <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.secondary, animationDelay: '0.2s' }}></div>
              <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.accent, animationDelay: '0.3s' }}></div>
              <div className="absolute bottom-1/3 right-1/3 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.primary, animationDelay: '0.4s' }}></div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

