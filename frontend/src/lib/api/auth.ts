import { apiClient } from './index'

// APIエラークラス
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 認証関連のAPI
export const authApi = {
  // ログイン
  async login(email: string, password: string) {
    try {
      const response = await apiClient.post<{ token: string; user: any }>('/auth/login', {
        email,
        password,
      })
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', response.token)
      }
      
      return response
    } catch (error: any) {
      throw new ApiError(
        error.message || 'ログインに失敗しました',
        error.status,
        error.code
      )
    }
  },

  // ユーザー登録
  async register(userData: {
    email: string
    password: string
    display_name: string
  }) {
    try {
      const response = await apiClient.post<{ token: string; user: any }>('/auth/register', userData)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', response.token)
      }
      
      return response
    } catch (error: any) {
      throw new ApiError(
        error.message || 'ユーザー登録に失敗しました',
        error.status,
        error.code
      )
    }
  },

  // ログアウト
  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // ログアウトエラーは無視
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
      }
    }
  },

  // 現在のユーザー情報を取得
  async getCurrentUser() {
    try {
      return await apiClient.get<any>('/users/me')
    } catch (error: any) {
      throw new ApiError(
        error.message || 'ユーザー情報の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  // ユーザー情報を更新
  async updateUser(userData: any) {
    try {
      return await apiClient.put<any>('/users/me', userData)
    } catch (error: any) {
      throw new ApiError(
        error.message || 'ユーザー情報の更新に失敗しました',
        error.status,
        error.code
      )
    }
  },

  // パスワードリセット要求
  async requestPasswordReset(email: string) {
    try {
      return await apiClient.post('/auth/forgot-password', { email })
    } catch (error: any) {
      throw new ApiError(
        error.message || 'パスワードリセットの要求に失敗しました',
        error.status,
        error.code
      )
    }
  },

  // パスワードリセット
  async resetPassword(token: string, newPassword: string) {
    try {
      return await apiClient.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      })
    } catch (error: any) {
      throw new ApiError(
        error.message || 'パスワードリセットに失敗しました',
        error.status,
        error.code
      )
    }
  },

  // メール確認
  async verifyEmail(token: string) {
    try {
      return await apiClient.post('/auth/verify-email', { token })
    } catch (error: any) {
      throw new ApiError(
        error.message || 'メール確認に失敗しました',
        error.status,
        error.code
      )
    }
  },

  // 確認メール再送信
  async resendVerificationEmail() {
    try {
      return await apiClient.post('/auth/resend-verification')
    } catch (error: any) {
      throw new ApiError(
        error.message || '確認メールの再送信に失敗しました',
        error.status,
        error.code
      )
    }
  },

  // パスワード変更
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      return await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
    } catch (error: any) {
      throw new ApiError(
        error.message || 'パスワードの変更に失敗しました',
        error.status,
        error.code
      )
    }
  },

  // アカウント削除
  async deleteAccount(password: string) {
    try {
      return await apiClient.delete('/auth/delete-account', { password })
    } catch (error: any) {
      throw new ApiError(
        error.message || 'アカウントの削除に失敗しました',
        error.status,
        error.code
      )
    }
  },

  // トークンリフレッシュ
  async refreshToken() {
    try {
      const response = await apiClient.post<{ token: string }>('/auth/refresh')
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', response.token)
      }
      
      return response
    } catch (error: any) {
      throw new ApiError(
        error.message || 'トークンの更新に失敗しました',
        error.status,
        error.code
      )
    }
  },
}