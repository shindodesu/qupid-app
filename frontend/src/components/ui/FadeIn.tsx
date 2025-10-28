/**
 * FadeInアニメーションコンポーネント
 * 
 * Framer Motionを使用したフェードイン効果
 */

'use client'

import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number
  duration?: number
  children: React.ReactNode
}

export const FadeIn = ({ 
  delay = 0, 
  duration = 0.5, 
  children, 
  ...props 
}: FadeInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}



