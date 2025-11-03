'use client'

import { useEffect, useState } from 'react'
import { X, Download, Sparkles } from 'lucide-react'

/**
 * ホーム画面内に表示するPWAインストールプロンプト
 * より目立つデザインで積極的にインストールを促す
 */
export function InAppPWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // PWA モードかどうかを判定
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(standalone)

    // すでにインストール済みの場合は表示しない
    if (standalone) {
      return
    }

    // 以前に閉じられたかどうかをチェック（短い間隔）
    const dismissed = localStorage.getItem('in-app-pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const now = Date.now()
    const hoursInMs = 2 * 60 * 60 * 1000 // 2時間

    // 2時間以内に閉じられた場合は表示しない
    if (now - dismissedTime < hoursInMs) {
      return
    }

    // 少し遅延して表示（読み込み完了後）
    const timer = setTimeout(() => {
      setIsDismissed(false)
      setShowPrompt(true)
    }, 2000)

    // Android/Desktop: beforeinstallprompt イベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    setIsDismissed(true)
    localStorage.setItem('in-app-pwa-install-dismissed', Date.now().toString())
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Desktop の場合はインストールプロンプトを表示
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`User response to the install prompt: ${outcome}`)
      
      setDeferredPrompt(null)
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setShowPrompt(false)
      }
    }
    
    localStorage.setItem('in-app-pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt || isStandalone) {
    return null
  }

  return (
    <div className="animate-slide-in-up">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl shadow-2xl p-4 mb-6 relative overflow-hidden">
        {/* 装飾的な背景要素 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative flex items-center gap-4">
          {/* アイコン */}
          <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm p-3 rounded-full">
            <Download className="w-6 h-6 text-white" />
          </div>

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
              <h3 className="text-lg font-bold text-white">
                アプリをインストール
              </h3>
            </div>
            <p className="text-sm text-white/90 mb-3">
              より速く、より便利に。ホーム画面からすぐにアクセスできます。
            </p>
            
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="w-full bg-white text-pink-600 py-2.5 px-4 rounded-xl font-semibold hover:bg-neutral-50 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>今すぐインストール</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-white text-pink-600 py-2.5 px-4 rounded-xl font-semibold hover:bg-neutral-50 transition-all shadow-lg"
                >
                  チェックする
                </button>
              </div>
            )}
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

