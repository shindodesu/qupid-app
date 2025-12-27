/**
 * テーマカラーストア
 * LGBTQ+向けのテーマカスタマイズ機能
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// テーマカラーの型定義
export interface ThemeColors {
  primary: string      // メインカラー
  secondary: string    // サブカラー
  accent: string       // アクセントカラー
  name: string         // テーマ名
  flag: string         // フラッグ名
}

// LGBTQ+フラッグのプリセットテーマ
export const THEME_PRESETS: Record<string, ThemeColors> = {
  default: {
    name: 'デフォルト',
    flag: 'デフォルト',
    primary: '#E94057',
    secondary: '#E91E63',
    accent: '#F48FB1',
  },
  pride: {
    name: 'レインボー',
    flag: 'Pride',
    primary: '#E40303',
    secondary: '#FF8C00',
    accent: '#FFED00',
  },
  trans: {
    name: 'トランスジェンダー',
    flag: 'Trans',
    primary: '#5BCEFA',
    secondary: '#F5A9B8',
    accent: '#FFFFFF',
  },
  bi: {
    name: 'バイセクシュアル',
    flag: 'Bi',
    primary: '#D60270',
    secondary: '#9B4F96',
    accent: '#0038A8',
  },
  pan: {
    name: 'パンセクシュアル',
    flag: 'Pan',
    primary: '#FF218C',
    secondary: '#FFD800',
    accent: '#21B1FF',
  },
  nonbinary: {
    name: 'ノンバイナリー',
    flag: 'Non-binary',
    primary: '#FFF430',
    secondary: '#FFFFFF',
    accent: '#9C59D1',
  },
  lesbian: {
    name: 'レズビアン',
    flag: 'Lesbian',
    primary: '#D52D00',
    secondary: '#FF9A56',
    accent: '#FFFFFF',
  },
  ace: {
    name: 'アセクシュアル',
    flag: 'Ace',
    primary: '#000000',
    secondary: '#A3A3A3',
    accent: '#FFFFFF',
  },
}

export interface ThemeState {
  currentTheme: string
  customTheme: ThemeColors | null
  setTheme: (themeId: string) => void
  setCustomTheme: (theme: ThemeColors) => void
  getCurrentThemeColors: () => ThemeColors
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'default',
      customTheme: null,
      
      setTheme: (themeId: string) => {
        set({ currentTheme: themeId, customTheme: null })
        // CSS変数を更新
        if (typeof window !== 'undefined') {
          const theme = THEME_PRESETS[themeId] || THEME_PRESETS.default
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
      },
      
      setCustomTheme: (theme: ThemeColors) => {
        set({ customTheme: theme, currentTheme: 'custom' })
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
      },
      
      getCurrentThemeColors: () => {
        const state = get()
        if (state.customTheme) {
          return state.customTheme
        }
        return THEME_PRESETS[state.currentTheme] || THEME_PRESETS.default
      },
    }),
    {
      name: 'qupid-theme-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // ストレージから復元時にCSS変数を更新
        if (state && typeof window !== 'undefined') {
          const theme = state.getCurrentThemeColors()
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
      },
    }
  )
)

