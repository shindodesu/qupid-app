'use client'

import { useEffect } from 'react'

/**
 * Service Worker 登録コンポーネント
 * PWAが確実に動作するようにService Workerを登録
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          console.log('Registering Service Worker...')
          
          // カスタムService Workerを登録
          const swUrl = '/sw-custom.js'
          const registration = await navigator.serviceWorker.register(swUrl, {
            scope: '/'
          })

          console.log('Service Worker registered successfully:', registration)

          // アップデートが利用可能な場合
          registration.addEventListener('updatefound', () => {
            console.log('Service Worker update found')
            const newWorker = registration.installing
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New Service Worker installed, reloading...')
                  window.location.reload()
                }
              })
            }
          })

          // Service Workerがコントロールを取得した場合
          if (registration.waiting) {
            console.log('Service Worker is waiting, claiming control...')
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }

          // Service Workerがアクティブになった場合
          if (registration.active) {
            console.log('Service Worker is active')
          }

        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }

      // ページが完全に読み込まれてからService Workerを登録
      if (document.readyState === 'complete') {
        registerSW()
      } else {
        window.addEventListener('load', registerSW)
      }
    }
  }, [])

  return null
}
