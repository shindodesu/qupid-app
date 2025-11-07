'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share2, Plus } from 'lucide-react'

interface PWADownloadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PWADownloadModal({ isOpen, onClose }: PWADownloadModalProps) {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iOS = /iphone|ipad|ipod/.test(userAgent)
    const android = /android/.test(userAgent)
    
    setIsIOS(iOS)
    setIsAndroid(android)
    
    // PWA モードかどうかを判定
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    
    setIsStandalone(standalone)
  }, [])

  if (!isOpen || isStandalone) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto animate-slide-up">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">アプリをインストール</h2>
                <p className="text-sm text-white/90">より快適にご利用いただけます</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {isIOS ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-100">
                <p className="text-center text-neutral-700 font-medium mb-4">
                  iOS デバイスの場合
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">共有ボタンをタップ</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Share2 className="w-4 h-4 text-pink-500" />
                        <span className="text-xs text-neutral-600">ブラウザの共有アイコンをタップ</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">「ホーム画面に追加」を選択</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Plus className="w-4 h-4 text-pink-500" />
                        <span className="text-xs text-neutral-600">リストから「ホーム画面に追加」をタップ</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">完了</p>
                      <p className="text-xs text-neutral-600">ホーム画面にQupidアイコンが追加されます</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isAndroid ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-xl border border-green-100">
                <p className="text-center text-neutral-700 font-medium mb-4">
                  Android デバイスの場合
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">通知を受け取る</p>
                      <p className="text-xs text-neutral-600">インストールプロンプトが表示されます</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">「インストール」をタップ</p>
                      <p className="text-xs text-neutral-600">アプリがインストールされます</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">ホーム画面から起動</p>
                      <p className="text-xs text-neutral-600">追加されたアイコンからアプリを起動できます</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <p className="text-center text-neutral-700 font-medium mb-4">
                  PC ブラウザの場合
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">アドレスバーを確認</p>
                      <p className="text-xs text-neutral-600">インストールアイコン（+）が表示されます</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">「インストール」をクリック</p>
                      <p className="text-xs text-neutral-600">デスクトップアプリとして追加されます</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-1">ショートカットから起動</p>
                      <p className="text-xs text-neutral-600">スタートメニューやデスクトップから起動可能</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* メリット */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">インストールのメリット</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-pink-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">⚡</div>
                <p className="text-xs text-neutral-700">高速起動</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">📱</div>
                <p className="text-xs text-neutral-700">簡単にアクセス</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🔔</div>
                <p className="text-xs text-neutral-700">通知受信</p>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

