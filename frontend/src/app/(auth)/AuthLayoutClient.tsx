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

  // 認証済みユーザーはホームにリダイレクト（オンボーディング関連ページを除く）
  useEffect(() => {
    // ローディング中または既にリダイレクト中は何もしない
    if (isLoading || redirectingRef.current) {
      return
    }
    
    // オンボーディング中に必要なページは認証済みユーザーもアクセス可能
    const onboardingPaths = [
      '/initial-profile',
      '/safety-intro',
      '/student-id-upload',
      '/age-verification-pending',
    ]
    if (onboardingPaths.includes(pathname)) {
      return
    }
    
    // 認証済みの場合はホームへ
    // ただし、ログインページ等での認証直後は、ページ側でのルーティング(router.push)を
    // 優先させるため、AuthLayoutClient側での強制リダイレクトはスキップする
    if (isAuthenticated) {
      const authPaths = ['/auth/login', '/auth/register', '/email-login']
      if (authPaths.includes(pathname)) {
        return
      }

      redirectingRef.current = true
      router.replace('/home')
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

  // 認証済みかつオンボーディング関連ページでない場合はリダイレクト画面を表示
  const onboardingPaths = [
    '/initial-profile',
    '/safety-intro',
    '/student-id-upload',
    '/age-verification-pending',
  ]
  if (isAuthenticated && !onboardingPaths.includes(pathname)) {
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

