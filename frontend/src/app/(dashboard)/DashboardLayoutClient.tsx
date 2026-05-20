'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated, useUser, useAuthLoading } from '@/stores/auth'
import { DashboardNav } from '@/components/layout/DashboardNav'
import { FilterProvider } from '@/components/providers/FilterProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const isLoading = useAuthLoading()
  const redirectingRef = useRef(false)

  // 認証チェック（ローディング完了後のみ、リダイレクト防止機能付き）
  useEffect(() => {
    console.log('[DashboardLayoutClient] useEffect triggered:', { 
      isAuthenticated, 
      isLoading, 
      userId: user?.id, 
      is_admin: user?.is_admin, 
      pathname: typeof window !== 'undefined' ? window.location.pathname : '' 
    })
    
    // ローディング中または既にリダイレクト中は何もしない
    if (isLoading || redirectingRef.current) {
      return
    }
    
    // 未認証の場合はログインページへ
    if (!isAuthenticated) {
      console.log('[DashboardLayoutClient] Not authenticated, redirecting to login')
      redirectingRef.current = true
      router.replace('/auth/login')
      return
    }
    
    // 年齢確認が未完了の場合は学生証アップロードへ（管理者は除外）
    if (user && user.age_verified === false && !user.is_admin) {
      console.log('[DashboardLayoutClient] Age not verified, redirecting to student-id-upload')
      redirectingRef.current = true
      router.replace('/student-id-upload')
      return
    }
    
    // プロフィール未完了の場合は初期プロフィール設定へ（管理者は除外）
    if (user && user.profile_completed === false && !user.is_admin) {
      console.log('[DashboardLayoutClient] Profile not completed, redirecting to initial-profile')
      redirectingRef.current = true
      router.replace('/initial-profile')
    }
  }, [isLoading, isAuthenticated, user, router])

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-neutral-600">認証を確認中...</p>
        </div>
      </div>
    )
  }

  // 未認証（リダイレクト待ち）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-neutral-600">リダイレクト中...</p>
        </div>
      </div>
    )
  }

  // プロフィール未完了（リダイレクト待ち）
  if (user && user.profile_completed === false && !user.is_admin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-neutral-600">プロフィール設定へ移動中...</p>
        </div>
      </div>
    )
  }



  // 認証済み＆プロフィール完了
  return (
    <ThemeProvider>
      <FilterProvider>
        <div className="min-h-screen bg-white">
          <DashboardNav />
          <main id="main-content" className="pb-20 md:pb-8" role="main">
            {children}
          </main>
        </div>
      </FilterProvider>
    </ThemeProvider>
  )
}

