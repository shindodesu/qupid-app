/**
 * 画像URLを構築するヘルパー関数
 */

// 実行時に環境変数を取得（クライアント側でのみ有効）
function getApiUrl(): string {
  // クライアント側とサーバー側の両方で環境変数から取得
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL
  const apiUrl = rawApiUrl || 'http://localhost:8000'
  
  // デバッグログ（本番環境でも確認できるように）
  if (typeof window !== 'undefined') {
    console.log('[getApiUrl] Raw NEXT_PUBLIC_API_URL:', rawApiUrl)
    console.log('[getApiUrl] Resolved API URL:', apiUrl)
    console.log('[getApiUrl] Current window location:', window.location.origin)
  }
  
  // 環境変数が空文字列やundefinedの場合はデフォルト値を使用
  if (!apiUrl || apiUrl.trim() === '') {
    console.error('[getApiUrl] NEXT_PUBLIC_API_URL is not set or empty!')
    console.error('[getApiUrl] This will cause images to fail loading.')
    console.error('[getApiUrl] Please set NEXT_PUBLIC_API_URL in Vercel environment variables and redeploy.')
    return 'http://localhost:8000'
  }
  
  // 末尾のスラッシュを削除
  const cleanUrl = apiUrl.replace(/\/$/, '')
  console.log('[getApiUrl] Final clean URL:', cleanUrl)
  return cleanUrl
}

/**
 * アバター画像のURLを取得
 * @param avatarUrl - データベースから取得したavatar_url
 * @returns 完全なURL
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) {
    console.log('[getAvatarUrl] No avatar URL provided')
    return null
  }
  
  // 空文字列の場合はnullを返す
  if (avatarUrl.trim() === '') {
    console.log('[getAvatarUrl] Empty avatar URL provided')
    return null
  }
  
  console.log('[getAvatarUrl] Input:', avatarUrl)
  
  // 既に完全なURLの場合はそのまま返す
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    console.log('[getAvatarUrl] Already full URL, returning as-is:', avatarUrl)
    return avatarUrl
  }
  
  // 相対パスの場合、APIのベースURLを追加
  // 先頭のスラッシュを削除して結合
  const cleanPath = avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl
  const apiUrl = getApiUrl()
  
  // API URLが正しく設定されているか確認
  if (!apiUrl || apiUrl.trim() === '') {
    console.error('[getAvatarUrl] API URL is not set correctly')
    return null
  }
  
  const fullUrl = `${apiUrl}/${cleanPath}`
  console.log('[getAvatarUrl] API URL:', apiUrl)
  console.log('[getAvatarUrl] Clean path:', cleanPath)
  console.log('[getAvatarUrl] Constructed URL:', fullUrl)
  
  // フロントエンドのドメインが含まれている場合は警告
  if (typeof window !== 'undefined' && fullUrl.includes(window.location.origin)) {
    console.error('[getAvatarUrl] WARNING: URL contains frontend domain!')
    console.error('[getAvatarUrl] This means NEXT_PUBLIC_API_URL is not set correctly.')
    console.error('[getAvatarUrl] Expected API URL:', apiUrl)
    console.error('[getAvatarUrl] Frontend origin:', window.location.origin)
  }
  
  return fullUrl
}

/**
 * 画像ファイルのURLを取得（汎用）
 * @param filePath - ファイルパス
 * @returns 完全なURL
 */
export function getImageUrl(filePath: string | null | undefined): string | null {
  if (!filePath || filePath.trim() === '') return null
  
  // 既に完全なURLの場合はそのまま返す
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }
  
  // 相対パスの場合、APIのベースURLを追加
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
  const apiUrl = getApiUrl()
  
  // API URLが正しく設定されているか確認
  if (!apiUrl || apiUrl.trim() === '') {
    console.error('[getImageUrl] API URL is not set correctly')
    return null
  }
  
  return `${apiUrl}/${cleanPath}`
}

