'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // 新規登録は常にメール認証フローから開始する。
    // 既存ログイン状態が残っている場合はここでクリアする。
    const startRegistrationFlow = async () => {
      await useAuthStore.getState().logout()
      router.replace('/email-login')
    }

    void startRegistrationFlow()
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <p className="mt-4 text-neutral-600">メール認証画面へ移動中...</p>
      </div>
    </div>
  )
}
