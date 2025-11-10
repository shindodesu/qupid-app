import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, title, children, size = 'md', ...props }, ref) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-6 px-4">
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
        />
        
        {/* モーダルコンテンツ */}
        <div
          ref={ref}
          className={cn(
            'relative w-full rounded-lg bg-white p-6 shadow-lg max-h-full overflow-y-auto',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {/* ヘッダー */}
          {title && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* コンテンツ */}
          {children}
        </div>
      </div>
    )
  }
)
Modal.displayName = 'Modal'

export { Modal }
