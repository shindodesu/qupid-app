/**
 * テーマカラーフック
 * コンポーネントでテーマカラーを簡単に使用するためのフック
 */

import { useThemeStore } from '@/stores/theme'

export function useTheme() {
  const { getCurrentThemeColors } = useThemeStore()
  const theme = getCurrentThemeColors()

  return {
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
  }
}

