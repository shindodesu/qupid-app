/**
 * Skeleton コンポーネントのテスト
 */

import { render } from '@testing-library/react'
import { Skeleton, CardSkeleton, ListSkeleton } from '../Skeleton'

describe('Skeleton', () => {
  it('正しくレンダリングされる', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('variant propsが正しく適用される', () => {
    const { container, rerender } = render(<Skeleton variant="text" />)
    expect(container.firstChild).toHaveClass('h-4')

    rerender(<Skeleton variant="circular" />)
    expect(container.firstChild).toHaveClass('rounded-full')

    rerender(<Skeleton variant="rectangular" />)
    expect(container.firstChild).toHaveClass('rounded-md')
  })

  it('width propsが正しく適用される', () => {
    const { container } = render(<Skeleton width={200} />)
    expect(container.firstChild).toHaveStyle({ width: '200px' })
  })

  it('height propsが正しく適用される', () => {
    const { container } = render(<Skeleton height={100} />)
    expect(container.firstChild).toHaveStyle({ height: '100px' })
  })

  it('animation propsが正しく適用される', () => {
    const { container, rerender } = render(<Skeleton animation="pulse" />)
    expect(container.firstChild).toHaveClass('animate-pulse')

    rerender(<Skeleton animation="wave" />)
    expect(container.firstChild).toHaveClass('animate-shimmer')

    rerender(<Skeleton animation="none" />)
    expect(container.firstChild).not.toHaveClass('animate-pulse')
    expect(container.firstChild).not.toHaveClass('animate-shimmer')
  })
})

describe('CardSkeleton', () => {
  it('デフォルトで1つのカードが表示される', () => {
    const { container } = render(<CardSkeleton />)
    const cards = container.querySelectorAll('.bg-white')
    expect(cards).toHaveLength(1)
  })

  it('count propsに応じた数のカードが表示される', () => {
    const { container } = render(<CardSkeleton count={3} />)
    const cards = container.querySelectorAll('.bg-white')
    expect(cards).toHaveLength(3)
  })
})

describe('ListSkeleton', () => {
  it('デフォルトで3つのアイテムが表示される', () => {
    const { container } = render(<ListSkeleton />)
    const items = container.querySelectorAll('.flex.items-center')
    expect(items).toHaveLength(3)
  })

  it('count propsに応じた数のアイテムが表示される', () => {
    const { container } = render(<ListSkeleton count={5} />)
    const items = container.querySelectorAll('.flex.items-center')
    expect(items).toHaveLength(5)
  })
})





