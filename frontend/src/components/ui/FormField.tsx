/**
 * フォームフィールドコンポーネント
 * 
 * バリデーションエラーの視覚的フィードバック付き
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label?: string
  error?: string
  success?: boolean
  required?: boolean
  hint?: string
  children: React.ReactNode
  className?: string
}

export const FormField = ({
  label,
  error,
  success,
  required,
  hint,
  children,
  className,
}: FormFieldProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {/* 成功インジケーター */}
        {success && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <svg 
              className="w-5 h-5 text-green-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </motion.div>
        )}
      </div>
      
      {/* エラーメッセージ */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2 text-sm text-red-600"
          >
            <svg 
              className="w-4 h-4 mt-0.5 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ヒント */}
      {hint && !error && (
        <p className="text-sm text-neutral-500">{hint}</p>
      )}
    </div>
  )
}

/**
 * パスワード強度インジケーター
 */
export const PasswordStrength = ({ password }: { password: string }) => {
  const calculateStrength = (pwd: string): number => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return Math.min(strength, 4)
  }
  
  const strength = calculateStrength(password)
  const labels = ['弱い', 'やや弱い', '普通', '強い', 'とても強い']
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600']
  
  if (password.length === 0) return null
  
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: i < strength ? '100%' : '0%' }}
            className={cn(
              'h-2 rounded-full transition-all',
              i < strength ? colors[strength] : 'bg-neutral-200'
            )}
          />
        ))}
      </div>
      <p className={cn(
        'text-sm font-medium',
        strength < 2 ? 'text-red-600' : strength < 3 ? 'text-yellow-600' : 'text-green-600'
      )}>
        {labels[strength]}
      </p>
    </div>
  )
}





