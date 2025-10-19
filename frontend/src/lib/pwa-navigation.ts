/**
 * PWA ナビゲーションヘルパー
 * PWAモードでリンクが別タブで開かれるのを防ぐ
 */

export function setupPWANavigation() {
  if (typeof window === 'undefined') return

  // PWA モードかどうかを判定
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')

  if (!isPWA) return

  // すべてのリンククリックをインターセプト
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a')
    
    if (!target) return
    
    const href = target.getAttribute('href')
    
    // 外部リンクまたはハッシュリンクはスキップ
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return
    }

    // target="_blank" は新しいタブで開く（意図的な動作）
    if (target.getAttribute('target') === '_blank') {
      return
    }

    // デフォルトの動作をキャンセル
    e.preventDefault()

    // Next.js のクライアントサイドルーティングを使用
    if (typeof window !== 'undefined' && (window as any).next) {
      const router = (window as any).next.router
      if (router) {
        router.push(href)
        return
      }
    }

    // フォールバック: 手動でナビゲート
    window.history.pushState({}, '', href)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, true) // キャプチャフェーズで処理

  console.log('PWA navigation intercept enabled')
}

/**
 * iOS PWA でのリンク動作を修正
 */
export function fixiOSPWALinks() {
  if (typeof window === 'undefined') return

  // iOS PWA モードの判定
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  const isStandalone = (window.navigator as any).standalone === true

  if (!isIOS || !isStandalone) return

  // iOS PWA 特有の修正
  document.addEventListener('DOMContentLoaded', () => {
    // すべてのリンクを取得
    const links = document.querySelectorAll('a[href^="/"]')
    
    links.forEach(link => {
      // rel 属性を削除（外部リンクとして扱われるのを防ぐ）
      link.removeAttribute('rel')
      
      // target 属性を削除（デフォルトは _self）
      if (link.getAttribute('target') !== '_blank') {
        link.removeAttribute('target')
      }
    })
  })

  console.log('iOS PWA link fixes applied')
}

