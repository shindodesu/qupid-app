'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
    // TODO: Sentryにエラーを送信
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-neutral-600 mb-6">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                <p className="text-xs font-mono text-red-800 break-all">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={reset} variant="outline" className="flex-1">
                再試行
              </Button>
              <Button
                onClick={() => (window.location.href = '/home')}
                className="flex-1"
              >
                ホームに戻る
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

