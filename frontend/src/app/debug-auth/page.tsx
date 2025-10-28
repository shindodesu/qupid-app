'use client'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const router = useRouter()
  const authState = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [cookies, setCookies] = useState('')
  const [localStorage, setLocalStorage] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // Cookie情報を取得
    if (typeof document !== 'undefined') {
      setCookies(document.cookie || '(Cookie なし)')
    }
    
    // LocalStorage情報を取得
    if (typeof window !== 'undefined') {
      const authStorage = window.localStorage.getItem('auth-storage')
      const authToken = window.localStorage.getItem('auth-token')
      setLocalStorage({
        authStorage: authStorage ? JSON.parse(authStorage) : null,
        authToken,
      })
    }
  }, [])

  const clearAuth = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth-storage')
      window.localStorage.removeItem('auth-token')
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      authState.logout()
      alert('認証情報をクリアしました')
      window.location.reload()
    }
  }

  // SSR時はローディング表示
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">認証デバッグページ</h1>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-center text-gray-500">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">認証デバッグページ</h1>
        
        <div className="space-y-6">
          {/* Zustandストア状態 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Zustand ストア状態</h2>
            <div className="space-y-2">
              <div>
                <strong>isAuthenticated:</strong>{' '}
                <span className={authState.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {authState.isAuthenticated ? '✓ 認証済み' : '✗ 未認証'}
                </span>
              </div>
              <div>
                <strong>isLoading:</strong> {authState.isLoading ? 'true' : 'false'}
              </div>
              <div>
                <strong>error:</strong> {authState.error || 'なし'}
              </div>
              <div>
                <strong>user:</strong>
                <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-sm">
                  {JSON.stringify(authState.user, null, 2)}
                </pre>
              </div>
              <div>
                <strong>tokens:</strong>
                <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-sm">
                  {JSON.stringify(authState.tokens, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Cookie情報 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cookie情報</h2>
            <pre className="p-3 bg-gray-100 rounded overflow-auto text-sm">
              {cookies}
            </pre>
          </div>

          {/* LocalStorage情報 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">LocalStorage情報</h2>
            <pre className="p-3 bg-gray-100 rounded overflow-auto text-sm">
              {JSON.stringify(localStorage, null, 2)}
            </pre>
          </div>

          {/* アクション */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">アクション</h2>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                ログインページへ
              </button>
              <button
                onClick={() => router.push('/home')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                ホームページへ
              </button>
              <button
                onClick={clearAuth}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                認証情報をクリア
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                リロード
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

