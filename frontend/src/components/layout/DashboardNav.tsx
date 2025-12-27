'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useTheme } from '@/hooks/useTheme'

const navItems = [
  {
    name: '探す',
    href: '/home',
    icon: 'search',
  },
  {
    name: 'いいね',
    href: '/matches',
    icon: 'likes',
  },
  {
    name: 'チャット',
    href: '/chat',
    icon: 'chat',
  },
  {
    name: 'プロフィール',
    href: '/profile',
    icon: 'profile',
  },
]

const settingsItems = [
  {
    name: 'テーマ',
    href: '/theme-settings',
    icon: '🎨',
  },
  {
    name: 'セーフティ',
    href: '/safety',
    icon: '🛡️',
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPWA, setIsPWA] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    const checkPWAMode = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      const iosStandalone = (window.navigator as any).standalone === true
      const isStandalone = standalone || iosStandalone
      setIsPWA(isStandalone)
      console.log('DashboardNav PWA Detection:', { standalone, iosStandalone, isStandalone })
    }

    checkPWAMode()
  }, [])

  const handleNavigation = (href: string) => {
    console.log('DashboardNav Navigation:', { href, isPWA })
    
    if (isPWA) {
      // PWAモードでは強制的にrouter.pushを使用
      router.push(href)
    } else {
      // ブラウザモードでは通常のナビゲーション
      window.location.href = href
    }
  }

  return (
    <nav className="bg-white border-b border-neutral-200" role="navigation" aria-label="メインナビゲーション">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <button 
            onClick={() => handleNavigation('/home')}
            className="flex items-center gap-2"
          >
            <img src="/icon.png" alt="Qupid" className="w-8 h-8" />
            <span className="text-xl font-bold text-primary-500">Qupid</span>
          </button>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                      isActive
                        ? 'text-theme-primary border border-theme-primary/30 shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                    style={isActive ? {
                      background: `${theme.primary}10`,
                    } : undefined}
                >
                  {item.icon === 'search' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {item.icon === 'likes' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  )}
                  {item.icon === 'chat' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                  {item.icon === 'profile' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                  <span>{item.name}</span>
                </button>
              )
            })}
            
            {/* セッティング項目 */}
            <div className="ml-2 pl-2 border-l border-neutral-200">
              {settingsItems.map((item) => {
                const isActive = pathname?.startsWith(item.href)
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                      isActive
                        ? 'text-theme-primary border border-theme-primary/30 shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                    style={isActive ? {
                      background: `${theme.primary}10`,
                    } : undefined}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>

          </div>
        </div>
      </div>

      {/* モバイルナビゲーション */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-2 transition-colors flex-1 relative',
                  isActive
                    ? 'text-red-500'
                    : 'text-neutral-600'
                )}
              >
                {/* アイコン */}
                <div className="relative mb-1">
                  {item.icon === 'search' && (
                    <svg 
                      className={cn(
                        'w-6 h-6',
                        isActive ? 'text-red-500' : 'text-neutral-400'
                      )}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {item.icon === 'likes' && (
                    <div className="relative">
                      {/* ピンクのハートアイコン（2つ重なっている） */}
                      <svg 
                        className={cn(
                          'w-6 h-6',
                          isActive ? 'text-theme-primary' : 'text-neutral-400'
                        )}
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      {/* 2つ目のハート（少しずらして重ねる） */}
                      <svg 
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5',
                          isActive ? 'text-theme-primary' : 'text-neutral-300'
                        )}
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                  )}
                  {item.icon === 'chat' && (
                    <svg 
                      className={cn(
                        'w-6 h-6',
                        isActive ? 'text-red-500' : 'text-neutral-400'
                      )}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                  {item.icon === 'profile' && (
                    <svg 
                      className={cn(
                        'w-6 h-6',
                        isActive ? 'text-blue-500' : 'text-neutral-400'
                      )}
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <span className={cn(
                  'text-xs',
                  isActive ? 'text-red-500' : 'text-neutral-600'
                )}>{item.name}</span>
              </button>
            )
          })}
          
        </div>
      </div>
    </nav>
  )
}

