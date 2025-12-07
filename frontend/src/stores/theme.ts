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
  gradient: string[]   // グラデーション用のカラー配列
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
    gradient: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#E94057'],
  },
  pride: {
    name: 'レインボー',
    flag: 'Pride',
    primary: '#E40303',
    secondary: '#FF8C00',
    accent: '#FFED00',
    gradient: ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'],
  },
  trans: {
    name: 'トランスジェンダー',
    flag: 'Trans',
    primary: '#5BCEFA',
    secondary: '#F5A9B8',
    accent: '#FFFFFF',
    gradient: ['#5BCEFA', '#F5A9B8', '#FFFFFF', '#F5A9B8', '#5BCEFA'],
  },
  bi: {
    name: 'バイセクシュアル',
    flag: 'Bi',
    primary: '#D60270',
    secondary: '#9B4F96',
    accent: '#0038A8',
    gradient: ['#D60270', '#9B4F96', '#0038A8'],
  },
  pan: {
    name: 'パンセクシュアル',
    flag: 'Pan',
    primary: '#FF218C',
    secondary: '#FFD800',
    accent: '#21B1FF',
    gradient: ['#FF218C', '#FFD800', '#21B1FF'],
  },
  nonbinary: {
    name: 'ノンバイナリー',
    flag: 'Non-binary',
    primary: '#FFF430',
    secondary: '#FFFFFF',
    accent: '#9C59D1',
    gradient: ['#FFF430', '#FFFFFF', '#9C59D1', '#000000'],
  },
  lesbian: {
    name: 'レズビアン',
    flag: 'Lesbian',
    primary: '#D52D00',
    secondary: '#FF9A56',
    accent: '#FFFFFF',
    gradient: ['#D52D00', '#FF9A56', '#FFFFFF', '#D362A4', '#A30262'],
  },
  ace: {
    name: 'アセクシュアル',
    flag: 'Ace',
    primary: '#000000',
    secondary: '#A3A3A3',
    accent: '#FFFFFF',
    gradient: ['#000000', '#A3A3A3', '#FFFFFF', '#810081'],
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

