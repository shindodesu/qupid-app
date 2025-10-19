'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            オフラインです
          </h1>
          <p className="text-gray-600">
            インターネット接続を確認してください
          </p>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          再読み込み
        </button>
      </div>
    </div>
  )
}