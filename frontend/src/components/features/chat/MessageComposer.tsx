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
  placeholder = 'メッセージを入力...',
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
    <form
      onSubmit={handleSubmit}
      className="border-t border-neutral-200 bg-white p-4"
    >
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 resize-none rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 max-h-32 min-h-[2.5rem]"
          rows={1}
          style={{
            height: 'auto',
            minHeight: '2.5rem',
            maxHeight: '8rem',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = `${Math.min(target.scrollHeight, 128)}px`
          }}
        />
        <Button
          type="submit"
          disabled={!content.trim() || disabled}
          className="h-10"
        >
          送信
        </Button>
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        Shift + Enter で改行、Enter で送信
      </p>
    </form>
  )
})

