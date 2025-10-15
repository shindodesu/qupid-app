'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuthStore, useIsAuthenticated, useAuthTokens } from '@/stores/auth'
import { authApi } from '@/lib/api/auth'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isAuthenticated = useIsAuthenticated()
  const tokens = useAuthTokens()
  const { setLoading, clearError, logout } = useAuthStore()

  // 初期化時の認証状態確認
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isAuthenticated || !tokens) {
        setLoading(false)
        return
      }

      // トークンの有効性チェック
      const now = Date.now()
      const tokenExpiry = tokens.expiresAt

      // トークンが期限切れの場合
      if (now >= tokenExpiry) {
        try {
          // リフレッシュトークンで更新を試行
          await useAuthStore.getState().refreshToken()
        } catch (error) {
          // リフレッシュに失敗した場合はログアウト
          logout()
        }
      } else {
        // トークンが有効な場合、ユーザー情報を取得
        try {
          const userData = await authApi.getCurrentUser()
          console.log('AuthProvider: user data fetched', userData)
          useAuthStore.getState().updateUser(userData)
        } catch (error) {
          console.error('AuthProvider: failed to fetch user data', error)
          // ユーザー情報取得に失敗した場合はログアウト
          logout()
        }
      }

      setLoading(false)
    }

    initializeAuth()
  }, [isAuthenticated, tokens, setLoading, logout])

  // トークン自動リフレッシュ
  useEffect(() => {
    if (!isAuthenticated || !tokens) return

    const now = Date.now()
    const tokenExpiry = tokens.expiresAt
    const refreshThreshold = 5 * 60 * 1000 // 5分前

    // トークンが期限切れに近い場合、自動リフレッシュ
    if (tokenExpiry - now <= refreshThreshold) {
      const refreshTimer = setTimeout(async () => {
        try {
          await useAuthStore.getState().refreshToken()
        } catch (error) {
          logout()
        }
      }, tokenExpiry - now - refreshThreshold)

      return () => clearTimeout(refreshTimer)
    }
  }, [isAuthenticated, tokens, logout])

  // エラークリア
  useEffect(() => {
    const timer = setTimeout(() => {
      clearError()
    }, 5000) // 5秒後にエラーを自動クリア

    return () => clearTimeout(timer)
  }, [clearError])

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading: useAuthStore((state) => state.isLoading),
    error: useAuthStore((state) => state.error),
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// 認証フック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 認証が必要なページ用のフック
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const { login, register, logout } = useAuthStore()

  return {
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  }
}

// 認証が不要なページ用のフック
export function useOptionalAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const { login, register, logout } = useAuthStore()

  return {
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  }
}
