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

    // iOS 特有の処理
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    // より強力なリンク修正
    const fixLinks = () => {
      const links = document.querySelectorAll('a[href^="/"]')
      links.forEach(link => {
        const href = link.getAttribute('href')
        if (!href || href.startsWith('http') || href.startsWith('#')) {
          return
        }

        // target="_blank" でない場合は、すべての属性を削除
        if (link.getAttribute('target') !== '_blank') {
          // すべての属性を削除
          link.removeAttribute('rel')
          link.removeAttribute('target')
          
          // 既存のイベントリスナーを削除
          link.onclick = null
          if ((link as any)._pwaClickHandler) {
            link.removeEventListener('click', (link as any)._pwaClickHandler, true)
          }
          
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
          
          // iOS 特有の追加処理
          if (isIOS) {
            // タッチイベントも処理
            link.addEventListener('touchend', (e) => {
              e.preventDefault()
              e.stopPropagation()
              e.stopImmediatePropagation()
              handleClick(e)
            }, true)
          }
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
    if (isIOS) {
      // iOSではより積極的にリンクを修正
      const intervalId = setInterval(() => {
        fixLinks()
      }, 500) // 0.5秒ごとにチェック

      // ページ全体のクリックイベントをインターセプト
      const globalClickHandler = (e: Event) => {
        const target = (e.target as HTMLElement)?.closest('a')
        if (target && target.getAttribute('href')?.startsWith('/')) {
          const href = target.getAttribute('href')
          if (href && !target.getAttribute('target')) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            
            console.log('Global PWA Navigation Fix: Navigating to', href)
            
            if (window.history && window.history.pushState) {
              window.history.pushState({}, '', href)
              const event = new PopStateEvent('popstate', { state: {} })
              window.dispatchEvent(event)
            } else {
              window.location.href = href
            }
            
            return false
          }
        }
      }

      document.addEventListener('click', globalClickHandler, true)

      return () => {
        observer.disconnect()
        clearInterval(intervalId)
        document.removeEventListener('click', globalClickHandler, true)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
