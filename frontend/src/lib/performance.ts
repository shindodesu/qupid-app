/**
 * パフォーマンス最適化ユーティリティ
 */

/**
 * Web Vitalsを測定してログに記録
 */
export function reportWebVitals(metric: any) {
  // 開発環境ではコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value)
  }

  // 本番環境では分析サービスに送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: Google Analytics / Sentryに送信
    // gtag('event', metric.name, {
    //   value: Math.round(metric.value),
    //   event_label: metric.id,
    //   non_interaction: true,
    // })
  }
}

/**
 * 画像の遅延読み込み用のIntersection Observer設定
 */
export const imageObserverOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: '50px',
  threshold: 0.01,
}

/**
 * パフォーマンスマーク
 */
export const performanceMark = {
  start: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`)
    }
  },
  end: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`)
      window.performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = window.performance.getEntriesByName(name)[0]
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}:`, `${measure.duration.toFixed(2)}ms`)
      }
    }
  },
}

/**
 * 重いコンポーネントのプリロード
 */
export const preloadComponent = (
  componentPromise: () => Promise<any>
): void => {
  // リンクにホバーした際などに使用
  componentPromise()
}

