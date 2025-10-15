/**
 * アクセシビリティ: スキップリンク
 * キーボードユーザーがメインコンテンツに直接ジャンプできるようにする
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-skipLink focus:bg-primary-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-medium"
    >
      メインコンテンツへスキップ
    </a>
  )
}

