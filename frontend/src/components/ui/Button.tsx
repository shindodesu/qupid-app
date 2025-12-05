import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loading } from './Loading'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: '!bg-primary-500 !text-white hover:!bg-primary-600',  // 赤/ピンク背景 - !importantで強制
        destructive: '!bg-red-500 !text-white hover:!bg-red-600',
        outline: 'border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900',
        secondary: '!bg-secondary-100 !text-secondary-700 hover:!bg-secondary-200',  // 薄いピンク背景
        ghost: 'text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900',
        link: 'underline-offset-4 hover:underline text-primary-500',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loading size="sm" variant="spinner" className="mr-2" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
