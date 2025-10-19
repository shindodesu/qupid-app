'use client'

import { useState, KeyboardEvent, memo, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

interface MessageComposerProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export const MessageComposer = memo(function MessageComposer({
  onSend,
  disabled = false,
  placeholder = 'Your message',
}: MessageComposerProps) {
  const [content, setContent] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim() && !disabled) {
      onSend(content.trim())
      setContent('')
    }
  }, [content, disabled, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit])

  return (
    <div className="border-t border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 max-h-32 min-h-[3rem]"
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
      </div>
    </div>
  )
})

