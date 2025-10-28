'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300) // アニメーション後に完全に削除
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white',
  }

  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'fixed bottom-4 right-4 z-toast px-4 py-3 rounded-lg shadow-lg max-w-sm',
        typeStyles[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icons[type]}</span>
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
          className="ml-auto hover:opacity-80 transition-opacity"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}

// グローバルなトースト管理
type ToastState = {
  id: string
  message: string
  type: ToastType
}

let toastListeners: ((toasts: ToastState[]) => void)[] = []
let toastQueue: ToastState[] = []

export const toast = {
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
  info: (message: string) => toast.show(message, 'info'),
  warning: (message: string) => toast.show(message, 'warning'),
  
  show: (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    const newToast: ToastState = { id, message, type }
    
    toastQueue = [...toastQueue, newToast]
    toastListeners.forEach((listener) => listener(toastQueue))
    
    // 自動削除
    setTimeout(() => {
      toastQueue = toastQueue.filter((t) => t.id !== id)
      toastListeners.forEach((listener) => listener(toastQueue))
    }, 3000)
  },
  
  subscribe: (listener: (toasts: ToastState[]) => void) => {
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  },
}

// トーストコンテナ
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  useEffect(() => {
    return toast.subscribe(setToasts)
  }, [])

  return (
    <AnimatePresence mode="sync">
      {toasts.map((t, index) => (
        <motion.div
          key={t.id}
          style={{ bottom: `${4 + index * 5}rem` }}
          className="fixed right-4 z-toast"
        >
          <Toast
            message={t.message}
            type={t.type}
            onClose={() => {
              toastQueue = toastQueue.filter((toast) => toast.id !== t.id)
              setToasts(toastQueue)
            }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

