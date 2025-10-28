'use client'

import dynamic from 'next/dynamic'

// クライアント側のみでレンダリングするラッパーコンポーネント
const AuthLayoutClient = dynamic(() => import('./AuthLayoutClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <p className="mt-4 text-neutral-600">読み込み中...</p>
      </div>
    </div>
  ),
})

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>
}
