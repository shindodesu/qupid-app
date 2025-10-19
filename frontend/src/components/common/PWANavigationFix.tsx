'use client'

import { useEffect } from 'react'

/**
 * PWA ナビゲーション修正コンポーネント
 * iOS PWAでリンクが別タブで開かれる問題を修正
 */
export function PWANavigationFix() {
  useEffect(() => {
    // PWA モードかどうかを判定
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (!isPWA) {
      return
    }

    console.log('PWA Navigation Fix: Initializing')

    // 既存のリンクを修正
    const fixLinks = () => {
      const links = document.querySelectorAll('a[href^="/"]')
      links.forEach(link => {
        const href = link.getAttribute('href')
        if (!href || href.startsWith('http') || href.startsWith('#')) {
          return
        }

        // target="_blank" でない場合は、すべての属性を削除
        if (link.getAttribute('target') !== '_blank') {
          link.removeAttribute('rel')
          link.removeAttribute('target')
          
          // 既存のクリックイベントを削除
          link.onclick = null
          
          // 新しいクリックイベントを追加
          const handleClick = (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            
            console.log('PWA Navigation Fix: Navigating to', href)
            
            // Next.jsのクライアントサイドルーティングを使用
            if (window.history && window.history.pushState) {
              window.history.pushState({}, '', href)
              // ページの変更を通知
              const event = new PopStateEvent('popstate', { state: {} })
              window.dispatchEvent(event)
            } else {
              // フォールバック: ページをリロード
              window.location.href = href
            }
            
            return false
          }
          
          // イベントリスナーを追加（キャプチャフェーズ）
          link.addEventListener('click', handleClick, true)
          
          // 古いイベントリスナーをクリーンアップするための参照を保存
          ;(link as any)._pwaClickHandler = handleClick
        }
      })
    }

    // 初期実行
    fixLinks()

    // DOM変更を監視して新しいリンクも修正
    const observer = new MutationObserver(() => {
      fixLinks()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // iOS 特有の処理
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      // iOSではより積極的にリンクを修正
      const intervalId = setInterval(() => {
        fixLinks()
      }, 1000) // 1秒ごとにチェック

      return () => {
        observer.disconnect()
        clearInterval(intervalId)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
