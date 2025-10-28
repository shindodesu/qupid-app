/**
 * LoginForm コンポーネントのテスト
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// QueryClientのモック
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const testQueryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('LoginForm', () => {
  it('正しくレンダリングされる', () => {
    render(<LoginForm />, { wrapper })
    
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
  })

  it('入力フィールドが正しく動作する', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper })
    
    const emailInput = screen.getByLabelText(/メールアドレス/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/パスワード/i) as HTMLInputElement
    
    await user.type(emailInput, 'test@s.kyushu-u.ac.jp')
    await user.type(passwordInput, 'Test1234')
    
    expect(emailInput.value).toBe('test@s.kyushu-u.ac.jp')
    expect(passwordInput.value).toBe('Test1234')
  })

  it('フォーム送信時にバリデーションが動作する', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper })
    
    const submitButton = screen.getByRole('button', { name: /ログイン/i })
    await user.click(submitButton)
    
    // バリデーションエラーが表示されることを期待
    await waitFor(() => {
      expect(screen.getByText(/メールアドレスを入力してください/i) || screen.getByText(/必須/i)).toBeInTheDocument()
    })
  })

  it('パスワードの表示/非表示が切り替わる', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper })
    
    const passwordInput = screen.getByLabelText(/パスワード/i) as HTMLInputElement
    expect(passwordInput.type).toBe('password')
    
    // パスワード表示ボタンをクリック
    const toggleButton = screen.getByRole('button', { name: /パスワードを表示/i })
    await user.click(toggleButton)
    
    expect(passwordInput.type).toBe('text')
    
    // もう一度クリックして非表示に
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('onSuccessコールバックが正しく呼ばれる', async () => {
    const handleSuccess = jest.fn()
    const user = userEvent.setup()
    
    // APIリクエストをモック
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token', user: { id: 1, email: 'test@s.kyushu-u.ac.jp' } }),
      })
    ) as jest.Mock

    render(<LoginForm onSuccess={handleSuccess} />, { wrapper })
    
    const emailInput = screen.getByLabelText(/メールアドレス/i)
    const passwordInput = screen.getByLabelText(/パスワード/i)
    const submitButton = screen.getByRole('button', { name: /ログイン/i })
    
    await user.type(emailInput, 'test@s.kyushu-u.ac.jp')
    await user.type(passwordInput, 'Test1234')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalled()
    })
  })
})



