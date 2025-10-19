'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

/**
 * PWA インストールプロンプトコンポーネント
 * iOS では手動インストールの案内を表示
 * Android では beforeinstallprompt イベントを使用
 */
export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // iOS かどうかを判定
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iOS = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(iOS)

    // PWA モードかどうかを判定
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(standalone)

    // すでにインストール済みの場合は表示しない
    if (standalone) {
      return
    }

    // 以前に閉じられたかどうかをチェック
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000

    // 1日以内に閉じられた場合は表示しない
    if (now - dismissedTime < dayInMs) {
      return
    }

    if (iOS) {
      // iOS: 3秒後に案内を表示
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      // Android/Desktop: beforeinstallprompt イベントをリッスン
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowPrompt(true)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  const handleInstall = async () => {
    if (isIOS) {
      // iOS の場合は何もしない（案内を表示しているだけ）
      return
    }

    if (!deferredPrompt) {
      return
    }

    // Android/Desktop の場合はインストールプロンプトを表示
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`User response to the install prompt: ${outcome}`)
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt || isStandalone) {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img src="/icon.png" alt="Qupid" className="w-12 h-12 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              アプリをインストール
            </h3>
            {isIOS ? (
              <div className="text-xs text-neutral-600 space-y-2">
                <p>Qupidをホーム画面に追加して、アプリのように使用できます。</p>
                <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded">
                  <span className="text-lg">⬆️</span>
                  <span>共有ボタンをタップ</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded">
                  <span className="text-lg">➕</span>
                  <span>「ホーム画面に追加」を選択</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-600 mb-3">
                Qupidをインストールして、より快適に利用できます。
              </p>
            )}
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="w-full mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                インストール
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

