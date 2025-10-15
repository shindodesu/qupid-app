import { useCallback, useEffect, useState } from 'react'
import { useAuthStore, type LoginCredentials, type RegisterCredentials } from '@/stores/auth'
import { authApi, ApiError } from '@/lib/api/auth'

// 認証フォーム用のフック
export function useAuthForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login, register, clearError } = useAuthStore()

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    setIsSubmitting(true)
    setError(null)
    clearError()

    try {
      await login(credentials)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [login, clearError])

  const handleRegister = useCallback(async (credentials: RegisterCredentials) => {
    setIsSubmitting(true)
    setError(null)
    clearError()

    try {
      await register(credentials)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ユーザー登録に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [register, clearError])

  const clearFormError = useCallback(() => {
    setError(null)
    clearError()
  }, [clearError])

  return {
    isSubmitting,
    error,
    handleLogin,
    handleRegister,
    clearFormError,
  }
}

// パスワードリセット用のフック
export function usePasswordReset() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsSubmitting(true)
    setError(null)
    setIsSuccess(false)

    try {
      await authApi.requestPasswordReset(email)
      setIsSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'パスワードリセットの要求に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    setIsSubmitting(true)
    setError(null)
    setIsSuccess(false)

    try {
      await authApi.resetPassword(token, newPassword)
      setIsSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'パスワードリセットに失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isSubmitting,
    isSuccess,
    error,
    requestPasswordReset,
    resetPassword,
    clearError,
  }
}

// メール確認用のフック
export function useEmailVerification() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyEmail = useCallback(async (token: string) => {
    setIsSubmitting(true)
    setError(null)
    setIsSuccess(false)

    try {
      await authApi.verifyEmail(token)
      setIsSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'メール確認に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const resendVerificationEmail = useCallback(async () => {
    setIsSubmitting(true)
    setError(null)
    setIsSuccess(false)

    try {
      await authApi.resendVerificationEmail()
      setIsSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : '確認メールの再送信に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isSubmitting,
    isSuccess,
    error,
    verifyEmail,
    resendVerificationEmail,
    clearError,
  }
}

// ユーザー情報更新用のフック
export function useUserUpdate() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { updateUser } = useAuthStore()

  const updateUserInfo = useCallback(async (userData: any) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const updatedUser = await authApi.updateUser(userData)
      updateUser(updatedUser)
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'ユーザー情報の更新に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [updateUser])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await authApi.changePassword(currentPassword, newPassword)
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'パスワードの変更に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const deleteAccount = useCallback(async (password: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await authApi.deleteAccount(password)
      useAuthStore.getState().logout()
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'アカウントの削除に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isSubmitting,
    error,
    updateUserInfo,
    changePassword,
    deleteAccount,
    clearError,
  }
}

// 認証状態の監視用フック
export function useAuthState() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  }
}

// 認証アクション用のフック
export function useAuthActions() {
  const { login, register, logout, refreshToken, updateUser, clearError } = useAuthStore()

  return {
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearError,
  }
}

// 認証が必要なページ用のフック
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthState()
  const { login, register, logout } = useAuthActions()

  // 認証が必要なページで未認証の場合の処理
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // ログインページにリダイレクト
      window.location.href = '/auth/login'
    }
  }, [isAuthenticated, isLoading])

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
  const { isAuthenticated, isLoading } = useAuthState()
  const { login, register, logout } = useAuthActions()

  return {
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  }
}
