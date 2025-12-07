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
    gradient: theme.gradient,
    gradientStyle: {
      background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
    },
    gradientBRStyle: {
      background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`,
    },
    gradientTextStyle: {
      background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    },
  }
}

