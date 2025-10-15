'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分
            gcTime: 10 * 60 * 1000, // 10分（旧cacheTime）
            retry: (failureCount, error: any) => {
              // 401エラー（認証エラー）の場合はリトライしない
              if (error?.status === 401) {
                return false
              }
              // 404エラーの場合もリトライしない
              if (error?.status === 404) {
                return false
              }
              // それ以外は最大3回までリトライ
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => {
              // 指数バックオフ: 1秒 → 2秒 → 4秒
              return Math.min(1000 * 2 ** attemptIndex, 30000)
            },
            refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
            refetchOnMount: true, // マウント時に再取得
            refetchOnReconnect: true, // 再接続時に再取得
          },
          mutations: {
            retry: false, // ミューテーションはリトライしない
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

