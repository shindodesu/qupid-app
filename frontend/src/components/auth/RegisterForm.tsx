'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { useAuthForm } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface RegisterFormProps {
  className?: string
  onSuccess?: () => void
}

export function RegisterForm({ className, onSuccess }: RegisterFormProps) {
  const router = useRouter()
  const { isSubmitting, error, handleRegister, clearFormError } = useAuthForm()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    display_name: '',
  })
  
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
    display_name?: string
  }>({})

  const validateForm = () => {
    const errors: typeof validationErrors = {}
    
    if (!formData.email) {
      errors.email = 'メールアドレスは必須です'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください'
    }
    
    if (!formData.password) {
      errors.password = 'パスワードは必須です'
    } else if (formData.password.length < 8) {
      errors.password = 'パスワードは8文字以上で入力してください'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'パスワードは大文字、小文字、数字を含む必要があります'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'パスワード確認は必須です'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません'
    }
    
    if (!formData.display_name) {
      errors.display_name = 'ニックネームは必須です'
    } else if (formData.display_name.length < 2) {
      errors.display_name = 'ニックネームは2文字以上で入力してください'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFormError()
    
    if (!validateForm()) return
    
    try {
      console.log('RegisterForm: submitting', formData.email)
      await handleRegister({
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name,
      })
      console.log('RegisterForm: register successful, redirecting to /home')
      onSuccess?.()
      router.push('/home')
    } catch (error) {
      console.error('RegisterForm: register failed', error)
      // エラーはhandleRegisterで処理される
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
        <CardTitle className="text-2xl text-center">新規登録</CardTitle>
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
            label="ニックネーム"
            type="text"
            placeholder="例: まさお"
            value={formData.display_name}
            onChange={handleInputChange('display_name')}
            error={validationErrors.display_name}
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
          
          <Input
            label="パスワード確認"
            type="password"
            placeholder="パスワードを再入力"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={validationErrors.confirmPassword}
            disabled={isSubmitting}
            required
          />
          
          <div className="text-xs text-neutral-500">
            パスワードは8文字以上で、大文字、小文字、数字を含む必要があります。
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              required
            />
            <span className="text-sm text-neutral-600">
              <a href="/terms" className="text-primary-500 hover:text-primary-600">
                利用規約
              </a>
              と
              <a href="/privacy" className="text-primary-500 hover:text-primary-600">
                プライバシーポリシー
              </a>
              に同意します
            </span>
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
            {isSubmitting ? '登録中...' : '新規登録'}
          </Button>
          
          <div className="text-center text-sm text-neutral-600">
            既にアカウントをお持ちの方は{' '}
            <button
              type="button"
              className="text-primary-500 hover:text-primary-600"
              onClick={() => router.push('/auth/login')}
            >
              ログイン
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
