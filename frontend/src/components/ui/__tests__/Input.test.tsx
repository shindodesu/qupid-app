/**
 * Input コンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'

describe('Input', () => {
  it('正しくレンダリングされる', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('labelが正しく表示される', () => {
    render(<Input label="Username" />)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('入力値が正しく変更される', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement
    await user.type(input, 'Hello World')
    
    expect(input.value).toBe('Hello World')
  })

  it('onChangeイベントが正しく発火する', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<Input placeholder="Enter text" onChange={handleChange} />)
    
    const input = screen.getByPlaceholderText('Enter text')
    await user.type(input, 'Test')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('disabled状態で正しくレンダリングされる', () => {
    render(<Input disabled placeholder="Disabled" />)
    const input = screen.getByPlaceholderText('Disabled')
    
    expect(input).toBeDisabled()
  })

  it('エラーメッセージが正しく表示される', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('required属性が正しく適用される', () => {
    render(<Input required placeholder="Required field" />)
    const input = screen.getByPlaceholderText('Required field')
    
    expect(input).toBeRequired()
  })

  it('type属性が正しく適用される', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    let input = screen.getByPlaceholderText('Email')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    input = screen.getByPlaceholderText('Password')
    expect(input).toHaveAttribute('type', 'password')
  })
})





