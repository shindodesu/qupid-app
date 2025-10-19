'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

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
  const router = useRouter()
  const [isPWA, setIsPWA] = useState(false)

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
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <span>{item.icon}</span>
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
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    )}
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
                  'flex flex-col items-center justify-center py-2 px-2 transition-colors flex-1',
                  isActive
                    ? 'text-red-500'
                    : 'text-neutral-600'
                )}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.name}</span>
              </button>
            )
          })}
          
        </div>
      </div>
    </nav>
  )
}

