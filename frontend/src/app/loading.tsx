export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
        <p className="mt-4 text-neutral-600 font-medium">読み込み中...</p>
      </div>
    </div>
  )
}

