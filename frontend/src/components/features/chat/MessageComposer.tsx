'use client'

import { useState, KeyboardEvent, memo, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface MessageComposerProps {
  onSend: (content: string) => void
  onTyping?: (isTyping: boolean) => void
  disabled?: boolean
  placeholder?: string
}

export const MessageComposer = memo(function MessageComposer({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Your message',
}: MessageComposerProps) {
  const [content, setContent] = useState('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim() && !disabled) {
      onSend(content.trim())
      setContent('')
      // 送信したらタイピング状態を解除
      if (onTyping && isTypingRef.current) {
        onTyping(false)
        isTypingRef.current = false
      }
    }
  }, [content, disabled, onSend, onTyping])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    
    // タイピング通知
    if (onTyping) {
      if (!isTypingRef.current && e.target.value.trim()) {
        onTyping(true)
        isTypingRef.current = true
      }
      
      // タイピング停止タイマーをリセット
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // 2秒後にタイピング状態を解除
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          onTyping(false)
          isTypingRef.current = false
        }
      }, 2000)
    }
  }, [onTyping])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (onTyping && isTypingRef.current) {
        onTyping(false)
      }
    }
  }, [onTyping])

  return (
    <div className="border-t border-neutral-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 max-h-32 min-h-[3rem]"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '3rem',
              maxHeight: '8rem',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`
            }}
          />
        </div>
        
        {/* ステッカー/絵文字ボタン */}
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          disabled={disabled}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        {/* 音声メッセージボタン */}
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
          disabled={disabled}
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>

        {/* 送信ボタン */}
        <Button
          type="submit"
          disabled={disabled || !content.trim()}
          className="h-12 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-white disabled:bg-primary-300 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0-9v9" />
            </svg>
            送信
          </span>
        </Button>
      </form>
    </div>
  )
})

