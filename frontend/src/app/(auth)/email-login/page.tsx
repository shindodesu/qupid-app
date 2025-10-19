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
  
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
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
        console.log('データベースで認証コードを確認してください')
        console.log('=====================================')
      }
      
      toast({
        title: "認証コードを送信しました",
        description: isDevelopment 
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
    mutationFn: async (data: EmailLoginData) => {
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
      
      // プロフィール完了チェック
      if (data.user.profile_completed) {
        router.push('/home')
      } else {
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
        console.log('=====================================')
      }
      
      toast({
        title: "認証コードを再送信しました",
        description: isDevelopment
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
            {step === 'email' ? 'メールアドレスを入力してください' : '認証コードを入力してください'}
          </p>
        </div>

        {step === 'email' ? (
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
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-gray-600">
                <strong>{email}</strong> {isDevelopment ? 'の認証コードを入力してください' : 'に送信された'}<br />
                {!isDevelopment && '6桁の認証コードを入力してください'}
                {isDevelopment && '（開発環境: コンソールまたはターミナルで確認）'}
              </p>
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

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            開発環境では認証コードがコンソールに表示されます
          </p>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
