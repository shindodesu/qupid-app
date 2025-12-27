'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore, THEME_PRESETS, type ThemeColors } from '@/stores/theme'
import { PageTransition, AnimatedBackground } from '@/components/ui/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeSettingsPage() {
  const { currentTheme, setTheme, getCurrentThemeColors } = useThemeStore()
  const [selectedTheme, setSelectedTheme] = useState(currentTheme)
  const theme = useTheme()

  useEffect(() => {
    setSelectedTheme(currentTheme)
  }, [currentTheme])

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setTheme(themeId)
    // テーマ変更を即座に反映するため、少し遅延してからCSS変数を再適用
    setTimeout(() => {
      const theme = getCurrentThemeColors()
      if (typeof window !== 'undefined') {
        document.documentElement.style.setProperty('--theme-primary', theme.primary)
        document.documentElement.style.setProperty('--theme-secondary', theme.secondary)
        document.documentElement.style.setProperty('--theme-accent', theme.accent)
        // 強制的に再レンダリングを促す
        window.dispatchEvent(new Event('themechange'))
      }
    }, 100)
  }

  const currentColors = getCurrentThemeColors()

  return (
    <PageTransition variant="scale">
      <div className="min-h-screen bg-theme-page relative overflow-hidden">
        <AnimatedBackground variant="bubbles" />
        
        <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
          {/* ヘッダー */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-theme-primary mb-1">
              テーマカラー設定
            </h1>
            <p className="text-sm text-neutral-600">
            アプリのテーマカラーを選択できます。
            </p>
          </motion.div>

          {/* 現在のテーマプレビュー */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="border-pink-200/40 shadow-2xl shadow-pink-500/10 bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-theme-primary">
                  現在のテーマ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {/* カラープレビュー */}
                      <div className="flex gap-2">
                        <div 
                          className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                          style={{ backgroundColor: currentColors.primary }}
                        />
                        <div 
                          className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                          style={{ backgroundColor: currentColors.secondary }}
                        />
                        <div 
                          className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                          style={{ backgroundColor: currentColors.accent }}
                        />
                      </div>
                      {/* カラープレビュー */}
                      <div 
                        className="flex-1 h-12 rounded-lg shadow-lg"
                        style={{
                          background: currentColors.primary
                        }}
                      />
                    </div>
                  </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* テーマ選択 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-pink-200/40 shadow-2xl shadow-pink-500/10 bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-theme-primary">
                  テーマを選択
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(THEME_PRESETS).map(([themeId, theme]) => (
                    <motion.button
                      key={themeId}
                      onClick={() => handleThemeSelect(themeId)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                        className={`
                        relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden
                        ${selectedTheme === themeId 
                          ? 'border-theme-primary shadow-lg shadow-theme' 
                          : 'border-neutral-200 hover:border-theme-primary/50'
                        }
                      `}
                    >
                      {/* 背景 */}
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: theme.primary
                        }}
                      />
                      
                      {/* コンテンツ */}
                      <div className="relative z-10">
                        <div 
                          className="h-20 rounded-lg shadow-md"
                          style={{
                            background: theme.primary
                          }}
                        />
                        
                        {/* 選択インジケーター */}
                        {selectedTheme === themeId && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: theme.primary }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 説明 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-neutral-600">
              選択したテーマはアプリ全体に適用され、自動的に保存されます
            </p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}

