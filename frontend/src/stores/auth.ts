import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { authApi } from '@/lib/api/auth'

// 認証関連の型定義
export interface User {
  id: number
  email: string
  display_name: string
  bio?: string
  faculty?: string
  grade?: string
  is_active?: boolean
  created_at?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  display_name: string
}

export interface AuthState {
  // 状態
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // アクション
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

// 認証ストア
export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // 初期状態
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ログイン
      login: async (credentials: LoginCredentials) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await authApi.login(credentials.email, credentials.password)
          console.log('Login response:', response)
          
          set((state) => {
            state.user = response.user
            state.tokens = {
              accessToken: response.token,
              refreshToken: response.token, // 簡略化
              expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24時間
            }
            state.isAuthenticated = true
            state.isLoading = false
            state.error = null
          })
          
          console.log('Auth state after login:', get())
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'ログインに失敗しました'
            state.isLoading = false
            state.isAuthenticated = false
            state.user = null
            state.tokens = null
          })
          throw error
        }
      },

      // ユーザー登録
      register: async (credentials: RegisterCredentials) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await authApi.register({
            email: credentials.email,
            password: credentials.password,
            display_name: credentials.display_name,
          })
          console.log('Register response:', response)
          
          set((state) => {
            state.user = response.user
            state.tokens = {
              accessToken: response.token,
              refreshToken: response.token, // 簡略化
              expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24時間
            }
            state.isAuthenticated = true
            state.isLoading = false
            state.error = null
          })
          
          console.log('Auth state after register:', get())
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'ユーザー登録に失敗しました'
            state.isLoading = false
            state.isAuthenticated = false
            state.user = null
            state.tokens = null
          })
          throw error
        }
      },

      // ログアウト
      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          // ログアウトエラーは無視
        }

        set((state) => {
          state.user = null
          state.tokens = null
          state.isAuthenticated = false
          state.error = null
          state.isLoading = false
        })

        // ローカルストレージからも削除
        localStorage.removeItem('auth-storage')
      },

      // トークンリフレッシュ
      refreshToken: async () => {
        const { tokens } = get()
        
        if (!tokens?.refreshToken) {
          throw new Error('リフレッシュトークンがありません')
        }

        try {
          const response = await authApi.refreshToken()
          
          set((state) => {
            if (state.tokens) {
              state.tokens.accessToken = response.token
              state.tokens.expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24時間
            }
          })
        } catch (error) {
          // リフレッシュに失敗した場合はログアウト
          get().logout()
          throw error
        }
      },

      // ユーザー情報更新
      updateUser: (userData: Partial<User>) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, userData)
          }
        })
      },

      // エラークリア
      clearError: () => {
        set((state) => {
          state.error = null
        })
      },

      // ローディング状態設定
      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },
    })),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// セレクター（パフォーマンス最適化用）
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)
export const useAuthTokens = () => useAuthStore((state) => state.tokens)

// アクション用のセレクター
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  refreshToken: state.refreshToken,
  updateUser: state.updateUser,
  clearError: state.clearError,
  setLoading: state.setLoading,
}))
