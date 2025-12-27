'use client'

import dynamic from 'next/dynamic'

// クライアント側のみでレンダリングするラッパーコンポーネント
const DashboardLayoutClient = dynamic(() => import('./DashboardLayoutClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <p className="mt-4 text-neutral-600">認証を確認中...</p>
      </div>
    </div>
  ),
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
