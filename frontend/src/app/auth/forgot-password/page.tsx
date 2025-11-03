'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  
  const [step, setStep] = useState<'email' | 'verify' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // 開発環境かどうかを判定
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_API_URL?.includes('localhost')

  const sendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      const requestBody = { email }
      console.log('[ForgotPassword] Sending request:', requestBody)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/email/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        let errorMessage = '認証コードの送信に失敗しました'
        try {
          const errorData = await response.json()
          console.error('[ForgotPassword] Error response:', errorData)
          console.error('[ForgotPassword] Errors array:', errorData.errors)
          console.error('[ForgotPassword] Full error details:', JSON.stringify(errorData, null, 2))
          
          // errors配列がある場合はそれを優先（文字列の配列の場合）
          if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            // エラーハンドラーから返される文字列の配列の場合
            if (typeof errorData.errors[0] === 'string') {
              errorMessage = errorData.errors.join(', ')
            } else {
              // オブジェクトの配列の場合（Pydanticの標準形式）
              const validationErrors = errorData.errors.map((err: any) => {
                const field = err.loc?.slice(1).join('.') || 'field'
                const msg = err.msg || err.message || '入力データが不正です'
                return `${field}: ${msg}`
              }).join(', ')
              errorMessage = validationErrors
            }
          } else if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail
            } else if (Array.isArray(errorData.detail)) {
              // Pydanticのバリデーションエラー形式
              const validationErrors = errorData.detail.map((err: any) => {
                const field = err.loc?.slice(1).join('.') || 'field'
                const msg = err.msg || err.message || '入力データが不正です'
                return `${field}: ${msg}`
              }).join(', ')
              errorMessage = validationErrors || '入力データが不正です'
            }
          }
        } catch (parseError) {
          console.error('[ForgotPassword] Failed to parse error response:', parseError)
          const responseText = await response.text().catch(() => '')
          errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      if (isDevelopment) {
        console.log('=== 開発環境: 認証コード送信完了 ===')
        console.log('認証ID:', data.verification_id)
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

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; verification_code: string; new_password: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/email/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'パスワードのリセットに失敗しました')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "パスワードをリセットしました",
        description: "新しいパスワードでログインしてください",
        type: "success"
      })
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    },
    onError: (error: any) => {
      toast({
        title: "エラーが発生しました",
        description: error.message || "パスワードのリセットに失敗しました",
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
    setStep('password')
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "エラー",
        description: "パスワードは8文字以上で入力してください",
        type: "error"
      })
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "エラー",
        description: "パスワードが一致しません",
        type: "error"
      })
      return
    }
    
    resetPasswordMutation.mutate({ 
      email, 
      verification_code: verificationCode,
      new_password: newPassword 
    })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">パスワードリセット</h1>
          <p className="text-gray-600">
            {step === 'email' && 'メールアドレスを入力してください'}
            {step === 'verify' && '認証コードを入力してください'}
            {step === 'password' && '新しいパスワードを設定してください'}
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
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="text-red-500 text-sm hover:text-red-600"
              >
                ログインに戻る
              </button>
            </div>
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
            >
              次へ
            </Button>
            
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
          <form onSubmit={handleResetPassword} className="space-y-6">
            <Input
              label="新しいパスワード"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'リセット中...' : 'パスワードをリセット'}
            </Button>
          </form>
        )}

        {isDevelopment && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              開発環境では認証コードがコンソールに表示されます
            </p>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}





