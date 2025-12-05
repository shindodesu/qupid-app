import { HTMLAttributes, ElementType, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
      h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
      h5: 'scroll-m-20 text-lg font-semibold tracking-tight',
      h6: 'scroll-m-20 text-base font-semibold tracking-tight',
      p: 'leading-7 [&:not(:first-child)]:mt-6',
      blockquote: 'mt-6 border-l-2 pl-6 italic',
      list: 'my-6 ml-6 list-disc [&>li]:mt-2',
      inlineCode: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      lead: 'text-xl text-muted-foreground',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-muted-foreground',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    },
    color: {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      tertiary: 'text-text-tertiary',
      inverse: 'text-text-inverse',
      disabled: 'text-text-disabled',
      success: 'text-success-600',
      warning: 'text-warning-600',
      error: 'text-error-600',
      info: 'text-info-600',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
  },
  defaultVariants: {
    variant: 'p',
    color: 'primary',
  },
})

export interface TypographyProps
  extends Omit<HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  as?: ElementType
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, size, weight, color, align, as, ...props }, ref) => {
    const Component = as || getDefaultElement(variant)
    
    return (
      <Component
        className={cn(
          typographyVariants({ variant, size, weight, color, align }),
          className
        )}
        ref={ref as any}
        {...props}
      />
    )
  }
)
Typography.displayName = 'Typography'

// バリアントに応じたデフォルト要素を取得
function getDefaultElement(variant: string | null | undefined): ElementType {
  switch (variant) {
    case 'h1':
      return 'h1'
    case 'h2':
      return 'h2'
    case 'h3':
      return 'h3'
    case 'h4':
      return 'h4'
    case 'h5':
      return 'h5'
    case 'h6':
      return 'h6'
    case 'blockquote':
      return 'blockquote'
    case 'list':
      return 'ul'
    case 'inlineCode':
      return 'code'
    case 'lead':
    case 'large':
    case 'small':
    case 'muted':
    case 'p':
    default:
      return 'p'
  }
}

// 個別のコンポーネント
export const Heading = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="h1"
      className={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', className)}
      {...props}
    />
  )
)
Heading.displayName = 'Heading'

export const Subheading = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="h2"
      className={cn('scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0', className)}
      {...props}
    />
  )
)
Subheading.displayName = 'Subheading'

export const Paragraph = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="p"
      className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
      {...props}
    />
  )
)
Paragraph.displayName = 'Paragraph'

export const Lead = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="lead"
      className={cn('text-xl text-text-secondary', className)}
      {...props}
    />
  )
)
Lead.displayName = 'Lead'

export const Large = forwardRef<HTMLDivElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="large"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
)
Large.displayName = 'Large'

export const Small = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="small"
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    />
  )
)
Small.displayName = 'Small'

export const Muted = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="muted"
      className={cn('text-sm text-text-tertiary', className)}
      {...props}
    />
  )
)
Muted.displayName = 'Muted'

export const Blockquote = forwardRef<HTMLQuoteElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="blockquote"
      className={cn('mt-6 border-l-2 border-border-primary pl-6 italic', className)}
      {...props}
    />
  )
)
Blockquote.displayName = 'Blockquote'

export const List = forwardRef<HTMLUListElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="list"
      className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}
      {...props}
    />
  )
)
List.displayName = 'List'

export const InlineCode = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="inlineCode"
      className={cn('relative rounded bg-neutral-100 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold', className)}
      {...props}
    />
  )
)
InlineCode.displayName = 'InlineCode'

export { Typography, typographyVariants }
