import { ReactNode } from 'react'

/**
 * 視覚的に隠すが、スクリーンリーダーでは読み上げられるコンポーネント
 */
interface VisuallyHiddenProps {
  children: ReactNode
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

