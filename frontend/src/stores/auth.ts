import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 認証関連の型定義
export interface User {
  id: number
  email: string
  display_name: string
  bio?: string
  campus?: string
  faculty?: string
  grade?: string
  birthday?: string
  gender?: string
  sexuality?: string
  looking_for?: string
  profile_completed?: boolean
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
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  setUser: (user: User | null) => void
  setTokens: (tokens: AuthTokens | null) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
}

// トークンをCookieに保存するヘルパー関数
const saveTokenToCookie = (token: string) => {
  if (typeof document !== 'undefined') {
    const expiresDate = new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24時間
    document.cookie = `auth-token=${token}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax`
    console.log('[Auth] Token saved to cookie')
  }
}

// Cookieからトークンを削除するヘルパー関数
const removeTokenFromCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    console.log('[Auth] Token removed from cookie')
  }
}

// 認証ストア
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初期状態
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ログイン
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })

        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            let errorMessage = 'ログインに失敗しました'
            try {
              const errorData = await response.json()
              console.error('[Auth] Login error response:', errorData)
              
              if (errorData.detail) {
                if (typeof errorData.detail === 'string') {
                  errorMessage = errorData.detail
                } else if (Array.isArray(errorData.detail)) {
                  // Pydanticのバリデーションエラー形式
                  const validationErrors = errorData.detail.map((err: any) => {
                    const field = err.loc?.slice(1).join('.') || 'field'
                    const msg = err.msg || '入力データが不正です'
                    return `${field}: ${msg}`
                  }).join(', ')
                  errorMessage = validationErrors || '入力データが不正です'
                }
              }
            } catch (parseError) {
              console.error('[Auth] Failed to parse error response:', parseError)
              const responseText = await response.text().catch(() => '')
              errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`
            }
            throw new Error(errorMessage)
          }

          const data = await response.json()
          console.log('[Auth] Login successful:', { userId: data.user?.id, hasToken: !!data.token })
          
          const tokens: AuthTokens = {
            accessToken: data.token,
            refreshToken: data.token,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24時間
          }
          
          // 状態を更新
          set({
            user: data.user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // トークンをCookieとLocalStorageに保存
          saveTokenToCookie(data.token)
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', data.token)
            console.log('[Auth] Token saved to localStorage')
          }
        } catch (error) {
          console.error('[Auth] Login error:', error)
          set({
            error: error instanceof Error ? error.message : 'ログインに失敗しました',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tokens: null,
          })
          throw error
        }
      },

      // ユーザー登録
      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null })

        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              display_name: credentials.display_name,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || 'ユーザー登録に失敗しました')
          }

          const data = await response.json()
          console.log('[Auth] Register successful:', { userId: data.user?.id, hasToken: !!data.token })
          
          const tokens: AuthTokens = {
            accessToken: data.token,
            refreshToken: data.token,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24時間
          }
          
          // 状態を更新
          set({
            user: data.user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // トークンをCookieとLocalStorageに保存
          saveTokenToCookie(data.token)
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', data.token)
            console.log('[Auth] Token saved to localStorage')
          }
        } catch (error) {
          console.error('[Auth] Register error:', error)
          set({
            error: error instanceof Error ? error.message : 'ユーザー登録に失敗しました',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tokens: null,
          })
          throw error
        }
      },

      // ログアウト
      logout: async () => {
        console.log('[Auth] Logging out...')
        
        // トークンを削除
        removeTokenFromCookie()
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
          localStorage.removeItem('auth-storage')
          console.log('[Auth] Tokens and storage cleared')
        }
        
        // 状態をクリア（最後に実行）
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        })
      },

      // トークンリフレッシュ
      refreshToken: async () => {
        const { tokens } = get()
        
        if (!tokens?.refreshToken) {
          console.log('[Auth] No refresh token available')
          throw new Error('リフレッシュトークンがありません')
        }

        try {
          // 現在のトークンが有効かチェック
          const now = Date.now()
          if (now < tokens.expiresAt - (5 * 60 * 1000)) {
            // 有効期限まで5分以上ある場合はリフレッシュ不要
            console.log('[Auth] Token still valid, refresh not needed')
            return
          }

          // TODO: リフレッシュトークンのAPI実装
          console.log('[Auth] Token refresh not implemented yet')
        } catch (error) {
          console.error('[Auth] Token refresh error:', error)
          // リフレッシュに失敗した場合はログアウト
          await get().logout()
          throw error
        }
      },

      // ユーザー情報更新
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
          console.log('[Auth] User updated:', userData)
        }
      },

      // ユーザー設定
      setUser: (user: User | null) => {
        set({ user })
        console.log('[Auth] User set:', user?.id)
      },

      // トークン設定
      setTokens: (tokens: AuthTokens | null) => {
        set({ tokens })
        if (tokens) {
          saveTokenToCookie(tokens.accessToken)
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', tokens.accessToken)
          }
          console.log('[Auth] Tokens set')
        }
      },

      // 認証状態設定
      setAuthenticated: (isAuthenticated: boolean) => {
        set({ isAuthenticated })
        console.log('[Auth] Authentication state set:', isAuthenticated)
      },

      // エラークリア
      clearError: () => {
        set({ error: null })
      },

      // ローディング状態設定
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // 初期化（アプリ起動時に呼び出す）
      initialize: async () => {
        console.log('[Auth] Initializing auth state...')
        set({ isLoading: true })
        
        try {
          // Cookieからトークンを取得（PWA対応）
          let tokenFromCookie: string | null = null
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';')
            const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
            if (authCookie) {
              tokenFromCookie = authCookie.split('=')[1]?.trim() || null
            }
          }
          
          // LocalStorageからトークンを取得
          let tokenFromStorage: string | null = null
          if (typeof window !== 'undefined') {
            tokenFromStorage = localStorage.getItem('auth-token')
          }
          
          // CookieとLocalStorageのトークンを同期
          const token = tokenFromCookie || tokenFromStorage
          if (token) {
            // トークンが見つかった場合、両方に保存して同期
            if (tokenFromCookie && !tokenFromStorage) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('auth-token', tokenFromCookie)
              }
            }
            if (tokenFromStorage && !tokenFromCookie) {
              saveTokenToCookie(tokenFromStorage)
            }
            
            // 既存の状態をチェック
            const state = get()
            const tokens: AuthTokens = {
              accessToken: token,
              refreshToken: token,
              expiresAt: state.tokens?.expiresAt || (Date.now() + (24 * 60 * 60 * 1000)), // 24時間
            }
            
            // トークンが期限切れかチェック
            const now = Date.now()
            if (now >= tokens.expiresAt) {
              console.log('[Auth] Token expired, logging out')
              await state.logout()
              return
            }
            
            // トークンが有効な場合、ユーザー情報を取得して状態を更新
            try {
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
              const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              })
              
              if (response.ok) {
                const user = await response.json()
                set({ 
                  user, 
                  tokens,
                  isAuthenticated: true,
                  isLoading: false 
                })
                console.log('[Auth] User data refreshed:', user.id)
                
                // Cookieも確実に更新
                saveTokenToCookie(token)
              } else {
                console.log('[Auth] Failed to fetch user data, clearing auth state')
                await state.logout()
              }
            } catch (error) {
              console.error('[Auth] Failed to refresh user data:', error)
              // ネットワークエラーの場合も状態をクリアしない（オフライン対応）
              set({ isLoading: false })
            }
          } else {
            // トークンが見つからない場合
            const state = get()
            if (state.isAuthenticated || state.tokens) {
              // 状態と実際のトークンが不一致の場合はクリア
              console.log('[Auth] Token mismatch, clearing state')
              await state.logout()
            } else {
              console.log('[Auth] No valid authentication found')
              set({ isLoading: false })
            }
          }
        } catch (error) {
          console.error('[Auth] Initialization error:', error)
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        console.log('[Auth] Rehydrating from localStorage...')
        return (state, error) => {
          if (error) {
            console.error('[Auth] Rehydration error:', error)
          } else if (state && state.isAuthenticated && state.tokens) {
            // トークンの有効期限チェック
            const now = Date.now()
            if (now >= state.tokens.expiresAt) {
              console.log('[Auth] Token expired during rehydration, clearing state')
              state.user = null
              state.tokens = null
              state.isAuthenticated = false
              removeTokenFromCookie()
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-token')
              }
            } else {
              console.log('[Auth] Rehydrated successfully, restoring cookie')
              // LocalStorageから復元された認証データをCookieにも保存
              saveTokenToCookie(state.tokens.accessToken)
            }
          } else {
            console.log('[Auth] No authentication data to restore')
          }
        }
      },
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
  setUser: state.setUser,
  setTokens: state.setTokens,
  setAuthenticated: state.setAuthenticated,
  clearError: state.clearError,
  setLoading: state.setLoading,
  initialize: state.initialize,
}))
