'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useIsAuthenticated, useAuthLoading } from '@/stores/auth'

export default function AuthLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()
  const redirectingRef = useRef(false)

  // 認証済みユーザーはホームにリダイレクト（initial-profileページを除く）
  useEffect(() => {
    if (isLoading || redirectingRef.current) {
      return
    }
    
    // initial-profileページは認証済みユーザーもアクセス可能
    if (pathname === '/initial-profile') {
      return
    }
    
    if (isAuthenticated) {
      redirectingRef.current = true
      router.push('/home')
    }
  }, [isLoading, isAuthenticated, pathname, router])

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-neutral-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 認証済みかつinitial-profileページでない場合はリダイレクト画面を表示
  if (isAuthenticated && pathname !== '/initial-profile') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-neutral-600">リダイレクト中...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

