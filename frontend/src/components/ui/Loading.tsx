import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = 'md', variant = 'spinner', ...props }, ref) => {
    if (variant === 'spinner') {
      return (
        <div
          ref={ref}
          className={cn(
            'animate-spin rounded-full border-2 border-neutral-200 border-t-primary-500',
            sizeClasses[size],
            className
          )}
          {...props}
        />
      )
    }

    if (variant === 'dots') {
      return (
        <div
          ref={ref}
          className={cn('flex space-x-1', className)}
          {...props}
        >
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500"></div>
        </div>
      )
    }

    if (variant === 'pulse') {
      return (
        <div
          ref={ref}
          className={cn(
            'animate-pulse rounded-full bg-primary-500',
            sizeClasses[size],
            className
          )}
          {...props}
        />
      )
    }

    return null
  }
)
Loading.displayName = 'Loading'

// ページ全体のローディングコンポーネント
export const PageLoading = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loading size="lg" className="mx-auto mb-4" />
        <p className="text-neutral-500">読み込み中...</p>
      </div>
    </div>
  )
}

// ボタン内のローディングコンポーネント
export const ButtonLoading = () => {
  return (
    <div className="flex items-center space-x-2">
      <Loading size="sm" />
      <span>読み込み中...</span>
    </div>
  )
}

export { Loading }
