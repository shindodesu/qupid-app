import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface UseToastReturn {
  toast: (toast: Omit<Toast, 'id'>) => void
  toasts: Toast[]
  removeToast: (id: string) => void
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toastWithId: Toast = {
      ...newToast,
      id,
      duration: newToast.duration ?? 5000,
    }

    setToasts(prev => [...prev, toastWithId])

    // 自動削除
    if (toastWithId.duration != null && toastWithId.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, toastWithId.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return {
    toast,
    toasts,
    removeToast,
  }
}
