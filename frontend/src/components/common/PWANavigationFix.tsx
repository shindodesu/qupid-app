'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * PWA ナビゲーション修正コンポーネント
 * iOS Safari でPWA内のリンクが新しいタブで開かれる問題を解決
 */
export function PWANavigationFix() {
  const router = useRouter()

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true

    if (!isIOS || !isPWA) {
      console.log('PWANavigationFix: Not iOS PWA, skipping fix')
      return
    }

    console.log('PWANavigationFix: iOS PWA detected, applying navigation fix')

    // リンクの修正関数
    const fixLinks = () => {
      const links = document.querySelectorAll('a[href^="/"]')
      links.forEach(link => {
        const href = link.getAttribute('href')
        if (href && !href.startsWith('http') && link.getAttribute('target') !== '_blank') {
          // rel属性とtarget属性を削除
          link.removeAttribute('rel')
          link.removeAttribute('target')
          
          // クリックイベントを上書き
          link.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('PWA Navigation: Navigating to', href)
            router.push(href)
          }, { capture: true })
        }
      })
    }

    // 初期実行
    fixLinks()

    // DOM変更を監視して新しく追加されたリンクも修正
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.tagName === 'A' || element.querySelector('a[href^="/"]')) {
                shouldFix = true
              }
            }
          })
        }
      })
      
      if (shouldFix) {
        setTimeout(fixLinks, 100)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // 定期的にも修正を実行（バックアップ）
    const interval = setInterval(fixLinks, 2000)

    // グローバルクリックハンドラー（最後の手段）
    const globalClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href^="/"]')
      
      if (link && link.getAttribute('target') !== '_blank') {
        const href = link.getAttribute('href')
        if (href && !href.startsWith('http')) {
          e.preventDefault()
          e.stopPropagation()
          console.log('Global PWA Navigation: Navigating to', href)
          router.push(href)
        }
      }
    }

    document.addEventListener('click', globalClickHandler, { capture: true })

    return () => {
      observer.disconnect()
      clearInterval(interval)
      document.removeEventListener('click', globalClickHandler, { capture: true })
    }
  }, [router])

  return null
}