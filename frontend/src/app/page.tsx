'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated, useAuthLoading } from '@/stores/auth'

export default function HomePage() {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // ローディング中はリダイレクトしない
    if (isLoading || hasRedirected.current) {
      return
    }

    // 認証状態が確定したらリダイレクト
    hasRedirected.current = true
    if (isAuthenticated) {
      router.replace('/home')
    } else {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-neutral-600">読み込み中...</p>
      </div>
    </div>
  )
}
