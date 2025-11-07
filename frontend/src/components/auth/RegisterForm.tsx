'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { cn } from '@/lib/utils'

interface RegisterFormProps {
  className?: string
  onSuccess?: () => void
}

export function RegisterForm({ className, onSuccess }: RegisterFormProps) {
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // メール認証ページにリダイレクト
    router.push('/email-login')
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="text-2xl text-center">新規登録</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-neutral-600">
              Qupidへようこそ！
            </p>
            <p className="text-sm text-neutral-500">
              メール認証とパスワード設定で安全に登録
            </p>
          </div>
          
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              className="mt-1 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              required
            />
            <span className="text-sm text-neutral-600">
              <a href="/terms" target="_blank" className="text-primary-500 hover:text-primary-600 underline">
                利用規約
              </a>
              と
              <a href="/privacy" target="_blank" className="text-primary-500 hover:text-primary-600 underline">
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
          >
            メールアドレスで登録
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
