'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { useAuthStore } from '@/stores/auth'

interface EmailLoginData {
  email: string
  verification_code: string
}

export default function EmailLoginPage() {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const { setUser, setTokens, setAuthenticated } = useAuthStore()
  
  const [step, setStep] = useState<'email' | 'verify' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isResending, setIsResending] = useState(false)
  
  // 開発環境かどうかを判定
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_API_URL?.includes('localhost')

  const sendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/email/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '認証コードの送信に失敗しました')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // 開発環境の場合のみコンソールログを出力
      if (isDevelopment) {
        console.log('=== 開発環境: 認証コード送信完了 ===')
        console.log('認証ID:', data.verification_id)
        if (data.verification_code) {
          console.log('🔑 認証コード:', data.verification_code)
          console.log('↑ こちらの6桁の認証コードを入力してください')
        } else {
          console.log('バックエンドのターミナルで認証コードを確認してください')
        }
        console.log('=====================================')
      }
      
      toast({
        title: "認証コードを送信しました",
        description: isDevelopment && data.verification_code
          ? `認証コード: ${data.verification_code}`
          : isDevelopment
          ? "開発環境ではブラウザのコンソールまたはバックエンドのターミナルで認証コードを確認してください"
          : "メールアドレスに認証コードを送信しました",
        type: "success"
      })
      setStep('verify')
    },
    onError: (error: any) => {
      toast({
        title: "エラーが発生しました",
        description: error.message || "認証コードの送信に失敗しました",
        type: "error"
      })
    }
  })

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: EmailLoginData & { password?: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/email/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '認証コードの検証に失敗しました')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // 新規ユーザーでパスワードが必要な場合
      if (data.requires_password) {
        toast({
          title: "新規登録",
          description: "パスワードを設定してください",
          type: "success"
        })
        setStep('password')
        return
      }
      
      // ログイン成功
      toast({
        title: "ログインしました",
        description: data.is_new_user ? "アカウントを作成しました" : "おかえりなさい！",
        type: "success"
      })
      
      // Zustandストアに認証情報を保存
      setUser(data.user)
      setTokens({
        accessToken: data.token,
        refreshToken: data.token,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000),
      })
      setAuthenticated(true)
      
      // トークンをCookieとLocalStorageにも保存
      if (typeof window !== 'undefined') {
        const expiresDate = new Date(Date.now() + (24 * 60 * 60 * 1000))
        document.cookie = `auth-token=${data.token}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax`
        localStorage.setItem('auth-token', data.token)
        console.log('認証情報を保存しました: トークン、ユーザー情報')
      }
      
      // 遷移判定
      const isProfileCompleted = data.user && data.user.profile_completed === true
      const isAgeVerified = data.user && data.user.age_verified === true
      console.log('[EmailLogin] Profile completion check:', {
        profile_completed: data.user?.profile_completed,
        age_verified: data.user?.age_verified,
        isProfileCompleted,
        isAgeVerified,
        isNewUser: data.is_new_user,
        userId: data.user?.id
      })
      
      // 新規ユーザーは必ず学生証アップロードへ
      if (data.is_new_user) {
        console.log('[EmailLogin] New user, redirecting to student-id-upload')
        router.push('/student-id-upload')
      } else if (!isAgeVerified) {
        // 既存ユーザーでも年齢確認が終わっていない場合は学生証アップロードへ
        // （既に提出済みの場合はアップロードAPIがpending/approvedを返す）
        console.log('[EmailLogin] Existing user without age verification, redirecting to student-id-upload')
        router.push('/student-id-upload')
      } else if (isProfileCompleted) {
        console.log('[EmailLogin] Existing user with profile completed, redirecting to home')
        router.push('/home')
      } else {
        console.log('[EmailLogin] Existing user without profile, redirecting to initial-profile')
        router.push('/initial-profile')
      }
    },
    onError: (error: any) => {
      toast({
        title: "エラーが発生しました",
        description: error.message || "認証コードの検証に失敗しました",
        type: "error"
      })
    }
  })

  const resendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/email/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '認証コードの再送信に失敗しました')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // 開発環境の場合のみコンソールログを出力
      if (isDevelopment) {
        console.log('=== 開発環境: 認証コード再送信完了 ===')
        console.log('認証ID:', data.verification_id)
        if (data.verification_code) {
          console.log('🔑 認証コード:', data.verification_code)
          console.log('↑ こちらの6桁の認証コードを入力してください')
        } else {
          console.log('バックエンドのターミナルで認証コードを確認してください')
        }
        console.log('=====================================')
      }
      
      toast({
        title: "認証コードを再送信しました",
        description: isDevelopment && data.verification_code
          ? `認証コード: ${data.verification_code}`
          : isDevelopment
          ? "開発環境ではブラウザのコンソールまたはバックエンドのターミナルで認証コードを確認してください"
          : "メールをご確認ください",
        type: "success"
      })
    },
    onError: (error: any) => {
      toast({
        title: "エラーが発生しました",
        description: error.message || "認証コードの再送信に失敗しました",
        type: "error"
      })
    }
  })

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        title: "エラー",
        description: "メールアドレスを入力してください",
        type: "error"
      })
      return
    }
    sendCodeMutation.mutate(email)
  }

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "エラー",
        description: "6桁の認証コードを入力してください",
        type: "error"
      })
      return
    }
    verifyCodeMutation.mutate({ email, verification_code: verificationCode })
  }

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    
    // パスワードのバリデーション
    if (!password || password.length < 8) {
      toast({
        title: "エラー",
        description: "パスワードは8文字以上で入力してください",
        type: "error"
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "エラー",
        description: "パスワードが一致しません",
        type: "error"
      })
      return
    }
    
    // パスワード付きで再度認証コードを検証
    verifyCodeMutation.mutate({ 
      email, 
      verification_code: verificationCode,
      password 
    })
  }

  const handleResendCode = () => {
    setIsResending(true)
    resendCodeMutation.mutate(email, {
      onSettled: () => {
        setIsResending(false)
      }
    })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Qupid</h1>
          <p className="text-gray-600">
            {step === 'email' && 'メールアドレスを入力してください'}
            {step === 'verify' && '認証コードを入力してください'}
            {step === 'password' && 'パスワードを設定してください'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@kyushu-u.ac.jp"
              required
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={sendCodeMutation.isPending}
            >
              {sendCodeMutation.isPending ? '送信中...' : '認証コードを送信'}
            </Button>
          </form>
        )}
        
        {step === 'verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-gray-600">
                <strong>{email}</strong> {isDevelopment ? 'の認証コードを入力してください' : 'に送信された'}<br />
                {!isDevelopment && '6桁の認証コードを入力してください'}
                {isDevelopment && '（開発環境: コンソールまたはターミナルで確認）'}
              </p>
              {!isDevelopment && (
                <p className="text-sm text-gray-500 mt-2">
                  メールが届かない場合は、迷惑メールフォルダもご確認ください。
                </p>
              )}
            </div>
            
            <Input
              label="認証コード"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={verifyCodeMutation.isPending}
            >
              {verifyCodeMutation.isPending ? '認証中...' : 'ログイン'}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || resendCodeMutation.isPending}
                className="text-red-500 text-sm hover:text-red-600 disabled:opacity-50"
              >
                {isResending || resendCodeMutation.isPending ? '再送信中...' : '認証コードを再送信'}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-gray-500 text-sm hover:text-gray-600"
              >
                メールアドレスを変更
              </button>
            </div>
          </form>
        )}
        
        {step === 'password' && (
          <form onSubmit={handleSetPassword} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-gray-600">
                安全なパスワードを設定してください
              </p>
            </div>
            
            <Input
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上で入力"
              minLength={8}
              required
            />
            
            <Input
              label="パスワード（確認）"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力してください"
              minLength={8}
              required
            />
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>• パスワードは8文字以上</p>
              <p>• 数字と英字を組み合わせることを推奨</p>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={verifyCodeMutation.isPending}
            >
              {verifyCodeMutation.isPending ? '登録中...' : 'アカウントを作成'}
            </Button>
          </form>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
