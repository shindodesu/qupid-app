'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // TODO: Sentryにエラーを送信
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

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
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                    <p className="text-xs font-mono text-red-800 break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => this.setState({ hasError: false })}
                    variant="outline"
                    className="flex-1"
                  >
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

    return this.props.children
  }
}

