'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  {
    name: '探す',
    href: '/home',
    icon: '🔍',
  },
  {
    name: 'いいね',
    href: '/matches',
    icon: '💕',
  },
  {
    name: 'チャット',
    href: '/chat',
    icon: '💬',
  },
  {
    name: 'プロフィール',
    href: '/profile',
    icon: '👤',
  },
]

const settingsItems = [
  {
    name: 'セーフティ',
    href: '/safety',
    icon: '🛡️',
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-neutral-200" role="navigation" aria-label="メインナビゲーション">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/home" className="flex items-center gap-2">
            <img src="/icon.png" alt="Qupid" className="w-8 h-8" />
            <span className="text-xl font-bold text-primary-500">Qupid</span>
          </Link>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                  onClick={(e) => {
                    // PWA モードでの追加処理
                    if (typeof window !== 'undefined') {
                      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true
                      
                      if (isPWA) {
                        console.log('PWA Link clicked:', item.href)
                        // デフォルトの動作をキャンセル
                        e.preventDefault()
                        
                        // Next.js Router を使用してナビゲート
                        if (window.history && window.history.pushState) {
                          window.history.pushState({}, '', item.href)
                          const event = new PopStateEvent('popstate', { state: {} })
                          window.dispatchEvent(event)
                        } else {
                          window.location.href = item.href
                        }
                      }
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {/* セッティング項目 */}
            <div className="ml-2 pl-2 border-l border-neutral-200">
              {settingsItems.map((item) => {
                const isActive = pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    )}
                    onClick={(e) => {
                      // PWA モードでの追加処理
                      if (typeof window !== 'undefined') {
                        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true
                        
                        if (isPWA) {
                          console.log('PWA Settings Link clicked:', item.href)
                          e.preventDefault()
                          
                          if (window.history && window.history.pushState) {
                            window.history.pushState({}, '', item.href)
                            const event = new PopStateEvent('popstate', { state: {} })
                            window.dispatchEvent(event)
                          } else {
                            window.location.href = item.href
                          }
                        }
                      }
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
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
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-2 transition-colors flex-1',
                  isActive
                    ? 'text-red-500'
                    : 'text-neutral-600'
                )}
                onClick={(e) => {
                  // PWA モードでの追加処理
                  if (typeof window !== 'undefined') {
                    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true
                    
                    if (isPWA) {
                      console.log('PWA Mobile Link clicked:', item.href)
                      e.preventDefault()
                      
                      if (window.history && window.history.pushState) {
                        window.history.pushState({}, '', item.href)
                        const event = new PopStateEvent('popstate', { state: {} })
                        window.dispatchEvent(event)
                      } else {
                        window.location.href = item.href
                      }
                    }
                  }
                }}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.name}</span>
              </Link>
            )
          })}
          
        </div>
      </div>
    </nav>
  )
}

