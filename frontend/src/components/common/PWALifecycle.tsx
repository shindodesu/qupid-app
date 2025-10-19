'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * PWA ライフサイクル管理コンポーネント
 * アプリ起動時にPWA関連の初期化を行う
 */
export function PWALifecycle() {
  const router = useRouter()
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // PWA モードかどうかを判定（より厳密に）
    const checkPWAMode = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      const iosStandalone = (window.navigator as any).standalone === true
      const androidApp = document.referrer.includes('android-app://')
      const isStandalone = standalone || iosStandalone || androidApp
      
      setIsPWA(isStandalone)
      
      console.log('PWA Detection:', {
        standalone,
        iosStandalone,
        androidApp,
        isStandalone,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      })
      
      return isStandalone
    }

    const isPWAMode = checkPWAMode()

    if (!isPWAMode) {
      console.log('Running in browser mode - PWA features disabled')
      return
    }

    console.log('Running in PWA mode - PWA features enabled')

    // Service Worker の登録確認
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('Service Worker is ready:', registration)
      }).catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
    }

    // PWAスタイルを強制適用
    document.documentElement.style.setProperty('--pwa-mode', '1')
    document.body.classList.add('pwa-mode')

    // リンククリックをインターセプトして、アプリ内で開く
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a')
      
      if (!target) return
      
      const href = target.getAttribute('href')
      
      // 内部リンクのみ処理
      if (!href || href.startsWith('http') || href.startsWith('#') || 
          href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      // target="_blank" は新しいタブで開く
      if (target.getAttribute('target') === '_blank') {
        return
      }

      // 同じドメインのリンクのみインターセプト
      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) {
          return
        }
      } catch {
        // 相対URLの場合はそのまま処理
      }

      // デフォルトの動作をキャンセル
      e.preventDefault()
      e.stopPropagation()

      // Next.js Router を使用してナビゲート
      console.log('Navigating to:', href)
      router.push(href)
    }

    // キャプチャフェーズでイベントをインターセプト
    document.addEventListener('click', handleClick, true)

    // iOS PWA 特有の修正
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      // すべてのリンクから rel 属性を削除
      const observer = new MutationObserver(() => {
        document.querySelectorAll('a[href^="/"]').forEach(link => {
          if (link.getAttribute('target') !== '_blank') {
            link.removeAttribute('rel')
            link.removeAttribute('target')
          }
        })
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      return () => {
        observer.disconnect()
        document.removeEventListener('click', handleClick, true)
      }
    }

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [router])

  return null
}

