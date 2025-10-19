/**
 * デザイントークン - Qupidアプリケーションの一貫したデザインシステム
 * Figmaデザインに基づいた色、タイポグラフィ、スペーシング、その他のデザイン要素を定義
 */

export const tokens = {
  // カラーパレット（Figmaデザイン準拠）
  colors: {
    primary: {
      50: '#fef2f2',    // 薄いピンク
      100: '#fee2e2',   // 薄いピンク
      200: '#fecaca',   // 薄いピンク
      300: '#fca5a5',   // 薄いピンク
      400: '#f87171',   // 中程度のピンク
      500: '#E94057',   // メインの赤/ピンク（Figmaデザインより）
      600: '#dc2626',   // 濃い赤
      700: '#b91c1c',   // より濃い赤
      800: '#991b1b',   // 非常に濃い赤
      900: '#7f1d1d',   // 最も濃い赤
    },
    secondary: {
      50: '#FFFBF5',    // オフホワイト/クリーム（サイドバー背景）
      100: '#FFEBEE',   // 薄いピンク
      200: '#FFCDD2',   // 薄いピンク
      300: '#F8BBD9',   // 薄いピンク
      400: '#F48FB1',   // 中程度のピンク
      500: '#E91E63',   // セカンダリピンク
      600: '#D81B60',   // 濃いピンク
      700: '#C2185B',   // より濃いピンク
      800: '#AD1457',   // 非常に濃いピンク
      900: '#880E4F',   // 最も濃いピンク
    },
    neutral: {
      50: '#f9fafb',    // 薄いグレー
      100: '#f3f4f6',   // フッター背景
      200: '#e5e7eb',   // ボーダー
      300: '#d1d5db',   // 薄いグレー
      400: '#9ca3af',   // 中程度のグレー
      500: '#6b7280',   // グレー
      600: '#4b5563',   // 濃いグレー
      700: '#374151',   // より濃いグレー
      800: '#1f2937',   // 非常に濃いグレー
      900: '#111827',   // 最も濃いグレー（テキスト）
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
  },

  // タイポグラフィ
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      '5xl': ['3rem', { lineHeight: '1' }],         // 48px
      '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // スペーシング
  spacing: {
    0: '0px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    7: '1.75rem',   // 28px
    8: '2rem',      // 32px
    9: '2.25rem',   // 36px
    10: '2.5rem',   // 40px
    11: '2.75rem',  // 44px
    12: '3rem',     // 48px
    14: '3.5rem',   // 56px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    28: '7rem',     // 112px
    32: '8rem',     // 128px
    36: '9rem',     // 144px
    40: '10rem',    // 160px
    44: '11rem',    // 176px
    48: '12rem',    // 192px
    52: '13rem',    // 208px
    56: '14rem',    // 224px
    60: '15rem',    // 240px
    64: '16rem',    // 256px
    72: '18rem',    // 288px
    80: '20rem',    // 320px
    96: '24rem',    // 384px
  },

  // ボーダーラディウス
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // シャドウ
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000',
  },

  // ブレークポイント
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // アニメーション
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },

  // レイヤー（z-index）
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const

// 型定義
export type ColorScale = keyof typeof tokens.colors.primary
export type FontSize = keyof typeof tokens.typography.fontSize
export type FontWeight = keyof typeof tokens.typography.fontWeight
export type Spacing = keyof typeof tokens.spacing
export type BorderRadius = keyof typeof tokens.borderRadius
export type BoxShadow = keyof typeof tokens.boxShadow
export type Breakpoint = keyof typeof tokens.breakpoints
export type ZIndex = keyof typeof tokens.zIndex

// セマンティックカラー（用途別の色定義）
export const semanticColors = {
  // テキストカラー
  text: {
    primary: tokens.colors.neutral[900],
    secondary: tokens.colors.neutral[600],
    tertiary: tokens.colors.neutral[500],
    inverse: tokens.colors.neutral[50],
    disabled: tokens.colors.neutral[400],
  },
  
  // 背景カラー
  background: {
    primary: '#ffffff',
    secondary: tokens.colors.neutral[50],
    tertiary: tokens.colors.neutral[100],
    inverse: tokens.colors.neutral[900],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // ボーダーカラー
  border: {
    primary: tokens.colors.neutral[200],
    secondary: tokens.colors.neutral[300],
    focus: tokens.colors.primary[500],
    error: tokens.colors.error[500],
    success: tokens.colors.success[500],
  },
  
  // 状態カラー
  state: {
    hover: tokens.colors.primary[50],
    active: tokens.colors.primary[100],
    focus: tokens.colors.primary[100],
    disabled: tokens.colors.neutral[100],
  },
} as const

// コンポーネント固有のトークン
export const componentTokens = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.5rem 1rem',
      lg: '0.75rem 2rem',
    },
  },
  input: {
    height: '2.5rem',  // 40px
    padding: '0.5rem 0.75rem',
  },
  card: {
    padding: '1.5rem',
    borderRadius: tokens.borderRadius.lg,
    shadow: tokens.boxShadow.md,
  },
  avatar: {
    size: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
      xl: '4rem',      // 64px
    },
  },
} as const