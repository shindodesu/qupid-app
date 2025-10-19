'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useFilter } from '@/components/providers/FilterProvider'

const navItems = [
  {
    name: '探す',
    href: '/home',
    icon: '🎴',
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
  const { setShowFilters } = useFilter()

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
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* フィルターボタン（Discoverページでのみ表示） */}
            {pathname?.startsWith('/home') && (
              <div className="ml-2 pl-2 border-l border-neutral-200">
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>フィルター</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* モバイルナビゲーション */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-center py-3 px-2 transition-colors flex-1',
                  isActive
                    ? 'text-primary-500'
                    : 'text-neutral-600'
                )}
              >
                <span className="text-2xl">{item.icon}</span>
              </Link>
            )
          })}
          
          {/* モバイルフィルターボタン（Discoverページでのみ表示） */}
          {pathname?.startsWith('/home') && (
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center justify-center py-3 px-2 text-neutral-600 transition-colors flex-1"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

