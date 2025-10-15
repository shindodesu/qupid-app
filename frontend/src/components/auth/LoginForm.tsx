'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { useAuthForm } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  className?: string
  onSuccess?: () => void
}

export function LoginForm({ className, onSuccess }: LoginFormProps) {
  const router = useRouter()
  const { isSubmitting, error, handleLogin, clearFormError } = useAuthForm()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {}
    
    if (!formData.email) {
      errors.email = 'メールアドレスは必須です'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください'
    }
    
    if (!formData.password) {
      errors.password = 'パスワードは必須です'
    } else if (formData.password.length < 6) {
      errors.password = 'パスワードは6文字以上で入力してください'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFormError()
    
    if (!validateForm()) return
    
    try {
      console.log('LoginForm: submitting', formData.email)
      await handleLogin(formData)
      console.log('LoginForm: login successful')
      
      // ログイン成功後、少し待ってからリダイレクト（状態更新を待つ）
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('LoginForm: redirecting to /home')
      onSuccess?.()
      router.push('/home')
    } catch (error) {
      console.error('LoginForm: login failed', error)
      // エラーはhandleLoginで処理される
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }))
    
    // 入力時にバリデーションエラーをクリア
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="text-2xl text-center">ログイン</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <Input
            label="メールアドレス"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={validationErrors.email}
            disabled={isSubmitting}
            required
          />
          
          <Input
            label="パスワード"
            type="password"
            placeholder="パスワードを入力"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={validationErrors.password}
            disabled={isSubmitting}
            required
          />
          
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-600">ログイン状態を保持</span>
            </label>
            
            <button
              type="button"
              className="text-sm text-primary-500 hover:text-primary-600"
              onClick={() => router.push('/auth/forgot-password')}
            >
              パスワードを忘れた方
            </button>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            variant="default"
            className="w-full"
            style={{ backgroundColor: '#E94057', color: 'white' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </Button>
          
          <div className="text-center text-sm text-neutral-600">
            アカウントをお持ちでない方は{' '}
            <button
              type="button"
              className="text-primary-500 hover:text-primary-600"
              onClick={() => router.push('/auth/register')}
            >
              新規登録
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
