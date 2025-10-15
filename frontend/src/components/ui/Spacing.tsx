import { HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spacingVariants = cva('', {
  variants: {
    size: {
      0: 'h-0 w-0',
      1: 'h-1 w-1',      // 4px
      2: 'h-2 w-2',      // 8px
      3: 'h-3 w-3',      // 12px
      4: 'h-4 w-4',      // 16px
      5: 'h-5 w-5',      // 20px
      6: 'h-6 w-6',      // 24px
      7: 'h-7 w-7',      // 28px
      8: 'h-8 w-8',      // 32px
      9: 'h-9 w-9',      // 36px
      10: 'h-10 w-10',   // 40px
      11: 'h-11 w-11',   // 44px
      12: 'h-12 w-12',   // 48px
      14: 'h-14 w-14',   // 56px
      16: 'h-16 w-16',   // 64px
      20: 'h-20 w-20',   // 80px
      24: 'h-24 w-24',   // 96px
      28: 'h-28 w-28',   // 112px
      32: 'h-32 w-32',   // 128px
      36: 'h-36 w-36',   // 144px
      40: 'h-40 w-40',   // 160px
      44: 'h-44 w-44',   // 176px
      48: 'h-48 w-48',   // 192px
      52: 'h-52 w-52',   // 208px
      56: 'h-56 w-56',   // 224px
      60: 'h-60 w-60',   // 240px
      64: 'h-64 w-64',   // 256px
      72: 'h-72 w-72',   // 288px
      80: 'h-80 w-80',   // 320px
      96: 'h-96 w-96',   // 384px
    },
    direction: {
      horizontal: 'w-full h-0',
      vertical: 'h-full w-0',
      both: 'h-full w-full',
    },
    type: {
      margin: 'm-0',
      padding: 'p-0',
      gap: 'gap-0',
      space: 'space-0',
    },
  },
  defaultVariants: {
    size: 4,
    direction: 'both',
    type: 'margin',
  },
})

export interface SpacingProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spacingVariants> {
  as?: keyof JSX.IntrinsicElements
}

const Spacing = forwardRef<HTMLDivElement, SpacingProps>(
  ({ className, size, direction, type, as = 'div', ...props }, ref) => {
    const Component = as
    
    return (
      <Component
        className={cn(
          spacingVariants({ size, direction, type }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Spacing.displayName = 'Spacing'

// 個別のスペーシングコンポーネント
export const Spacer = forwardRef<HTMLDivElement, Omit<SpacingProps, 'type'>>(
  ({ className, size = 4, direction = 'vertical', ...props }, ref) => (
    <Spacing
      ref={ref}
      size={size}
      direction={direction}
      type="margin"
      className={cn('flex-shrink-0', className)}
      {...props}
    />
  )
)
Spacer.displayName = 'Spacer'

export const Divider = forwardRef<HTMLHRElement, Omit<SpacingProps, 'type' | 'direction'>>(
  ({ className, size = 1, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn(
        'border-0 bg-border-primary',
        size === 1 && 'h-px',
        size === 2 && 'h-0.5',
        size === 3 && 'h-1',
        size === 4 && 'h-1.5',
        className
      )}
      {...props}
    />
  )
)
Divider.displayName = 'Divider'

export const Container = forwardRef<HTMLDivElement, Omit<SpacingProps, 'type' | 'direction'>>(
  ({ className, size, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mx-auto w-full',
        size === 'sm' && 'max-w-sm',
        size === 'md' && 'max-w-md',
        size === 'lg' && 'max-w-lg',
        size === 'xl' && 'max-w-xl',
        size === '2xl' && 'max-w-2xl',
        size === '3xl' && 'max-w-3xl',
        size === '4xl' && 'max-w-4xl',
        size === '5xl' && 'max-w-5xl',
        size === '6xl' && 'max-w-6xl',
        size === '7xl' && 'max-w-7xl',
        !size && 'max-w-7xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Container.displayName = 'Container'

export const Stack = forwardRef<HTMLDivElement, Omit<SpacingProps, 'type' | 'direction'> & {
  direction?: 'horizontal' | 'vertical'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}>(
  ({ 
    className, 
    size = 4, 
    direction = 'vertical', 
    align = 'stretch', 
    justify = 'start', 
    wrap = false,
    children, 
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex',
        direction === 'horizontal' && 'flex-row',
        direction === 'vertical' && 'flex-col',
        align === 'start' && 'items-start',
        align === 'center' && 'items-center',
        align === 'end' && 'items-end',
        align === 'stretch' && 'items-stretch',
        justify === 'start' && 'justify-start',
        justify === 'center' && 'justify-center',
        justify === 'end' && 'justify-end',
        justify === 'between' && 'justify-between',
        justify === 'around' && 'justify-around',
        justify === 'evenly' && 'justify-evenly',
        wrap && 'flex-wrap',
        direction === 'horizontal' && `space-x-${size}`,
        direction === 'vertical' && `space-y-${size}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Stack.displayName = 'Stack'

export const Grid = forwardRef<HTMLDivElement, Omit<SpacingProps, 'type' | 'direction'> & {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  responsive?: boolean
}>(
  ({ 
    className, 
    cols = 1, 
    gap = 4, 
    responsive = true,
    children, 
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-2',
        cols === 3 && 'grid-cols-3',
        cols === 4 && 'grid-cols-4',
        cols === 5 && 'grid-cols-5',
        cols === 6 && 'grid-cols-6',
        cols === 12 && 'grid-cols-12',
        gap === 1 && 'gap-1',
        gap === 2 && 'gap-2',
        gap === 3 && 'gap-3',
        gap === 4 && 'gap-4',
        gap === 5 && 'gap-5',
        gap === 6 && 'gap-6',
        gap === 8 && 'gap-8',
        gap === 10 && 'gap-10',
        gap === 12 && 'gap-12',
        responsive && 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Grid.displayName = 'Grid'

export { Spacing, spacingVariants }
