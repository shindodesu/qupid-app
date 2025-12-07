/**
 * テーマプロバイダー
 * アプリ起動時にテーマを初期化
 */

'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { getCurrentThemeColors, currentTheme } = useThemeStore()

  // テーマカラーを適用する関数
  const applyTheme = () => {
    const theme = getCurrentThemeColors()
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      // 基本テーマ変数
      root.style.setProperty('--theme-primary', theme.primary)
      root.style.setProperty('--theme-secondary', theme.secondary)
      root.style.setProperty('--theme-accent', theme.accent)
      // Tailwind v4用のカラー変数も更新
      root.style.setProperty('--color-primary-500', theme.primary)
      root.style.setProperty('--color-secondary-500', theme.secondary)
      root.style.setProperty('--color-pink-500', theme.primary)
      root.style.setProperty('--color-pink-600', theme.primary)
      root.style.setProperty('--color-rose-500', theme.secondary)
      root.style.setProperty('--color-rose-600', theme.secondary)
    }
  }

  useEffect(() => {
    // 初期化時にテーマカラーを適用
    applyTheme()
  }, [])

  // テーマ変更を監視
  useEffect(() => {
    applyTheme()
  }, [currentTheme, getCurrentThemeColors])

  // Zustandストアの変更を監視
  useEffect(() => {
    const unsubscribe = useThemeStore.subscribe(
      (state) => {
        const theme = state.getCurrentThemeColors()
        if (typeof window !== 'undefined') {
          const root = document.documentElement
          // 基本テーマ変数
          root.style.setProperty('--theme-primary', theme.primary)
          root.style.setProperty('--theme-secondary', theme.secondary)
          root.style.setProperty('--theme-accent', theme.accent)
          // Tailwind v4用のカラー変数も更新
          root.style.setProperty('--color-primary-500', theme.primary)
          root.style.setProperty('--color-secondary-500', theme.secondary)
          root.style.setProperty('--color-pink-500', theme.primary)
          root.style.setProperty('--color-pink-600', theme.primary)
          root.style.setProperty('--color-rose-500', theme.secondary)
          root.style.setProperty('--color-rose-600', theme.secondary)
        }
      }
    )
    return unsubscribe
  }, [])

  return <>{children}</>
}
