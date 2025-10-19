'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated } from '@/stores/auth'
import { DashboardNav } from '@/components/layout/DashboardNav'
import { FilterProvider } from '@/components/providers/FilterProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    console.log('DashboardLayout: isAuthenticated =', isAuthenticated)
    if (!isAuthenticated) {
      console.log('DashboardLayout: redirecting to login')
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    console.log('DashboardLayout: rendering loading screen')
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-neutral-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">認証を確認中...</p>
        </div>
      </div>
    )
  }

  console.log('DashboardLayout: rendering dashboard')

  return (
    <FilterProvider>
      <div className="min-h-screen bg-neutral-50">
        <DashboardNav />
        <main id="main-content" className="pb-20 md:pb-8" role="main">
          {children}
        </main>
      </div>
    </FilterProvider>
  )
}

