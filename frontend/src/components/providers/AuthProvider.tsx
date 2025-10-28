'use client'

import { createContext, useContext, useEffect, ReactNode, useState } from 'react'
import { useAuthStore, useIsAuthenticated, useAuthError, useAuthLoading } from '@/stores/auth'

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
  const [initialized, setInitialized] = useState(false)
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()
  const error = useAuthError()

  // 初期化時の認証状態確認（一度だけ実行）
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthProvider] Initializing...')
      try {
        // getState()を使用して直接アクセス（依存配列の問題を回避）
        await useAuthStore.getState().initialize()
      } catch (error) {
        console.error('[AuthProvider] Initialization failed:', error)
      } finally {
        setInitialized(true)
        console.log('[AuthProvider] Initialization complete')
      }
    }

    initializeAuth()
  }, []) // 空の依存配列で一度だけ実行

  // エラー自動クリア
  useEffect(() => {
    if (!error) return

    const timer = setTimeout(() => {
      // getState()を使用して直接アクセス
      useAuthStore.getState().clearError()
    }, 5000) // 5秒後にエラーを自動クリア

    return () => clearTimeout(timer)
  }, [error]) // errorのみを依存配列に含める

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading: !initialized || isLoading,
    error,
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
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)

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
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)

  return {
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  }
}
