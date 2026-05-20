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
 * URL/パス文字列から改行・タブなどの制御文字と余分な空白を除去
 */
function sanitizeUrlLike(value: string): string {
  return value
    .replace(/[\r\n\t]/g, '') // 改行・タブ除去
    .replace(/\s+/g, ' ') // 連続空白は1つへ
    .trim()
}

/**
 * デフォルトアバター画像のパス
 */
export const DEFAULT_AVATAR_PATH = '/initial_icon.svg'

/**
 * アバター画像のURLを取得
 * @param avatarUrl - データベースから取得したavatar_url
 * @param useDefault - avatarUrlがnullの場合にデフォルト画像を返すかどうか（デフォルト: false）
 * @returns 完全なURL、またはデフォルト画像のパス
 */
export function getAvatarUrl(avatarUrl: string | null | undefined, useDefault: boolean = false): string | null {
  if (!avatarUrl) {
    console.log('[getAvatarUrl] No avatar URL provided')
    if (useDefault) {
      return DEFAULT_AVATAR_PATH
    }
    return null
  }
  
  const sanitizedAvatarUrl = sanitizeUrlLike(avatarUrl)

  // 空文字列の場合はnullを返す（またはデフォルト画像）
  if (sanitizedAvatarUrl === '') {
    console.log('[getAvatarUrl] Empty avatar URL provided')
    if (useDefault) {
      return DEFAULT_AVATAR_PATH
    }
    return null
  }
  
  console.log('[getAvatarUrl] Input:', avatarUrl)
  console.log('[getAvatarUrl] Sanitized input:', sanitizedAvatarUrl)
  
  // 既に完全なURLの場合はそのまま返す
  if (sanitizedAvatarUrl.startsWith('http://') || sanitizedAvatarUrl.startsWith('https://')) {
    console.log('[getAvatarUrl] Already full URL, returning as-is:', sanitizedAvatarUrl)
    return sanitizedAvatarUrl
  }
  
  // 相対パスの場合、APIのベースURLを追加
  // 先頭のスラッシュを削除して結合
  const cleanPath = sanitizedAvatarUrl.startsWith('/') ? sanitizedAvatarUrl.slice(1) : sanitizedAvatarUrl
  const apiUrl = getApiUrl()
  
  // API URLが正しく設定されているか確認
  if (!apiUrl || apiUrl.trim() === '') {
    console.error('[getAvatarUrl] API URL is not set correctly')
    if (useDefault) {
      return DEFAULT_AVATAR_PATH
    }
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
  if (!filePath) return null
  const sanitizedFilePath = sanitizeUrlLike(filePath)
  if (sanitizedFilePath === '') return null
  
  // 既に完全なURLの場合はそのまま返す
  if (sanitizedFilePath.startsWith('http://') || sanitizedFilePath.startsWith('https://')) {
    return sanitizedFilePath
  }
  
  // 相対パスの場合、APIのベースURLを追加
  const cleanPath = sanitizedFilePath.startsWith('/') ? sanitizedFilePath.slice(1) : sanitizedFilePath
  const apiUrl = getApiUrl()
  
  // API URLが正しく設定されているか確認
  if (!apiUrl || apiUrl.trim() === '') {
    console.error('[getImageUrl] API URL is not set correctly')
    return null
  }
  
  return `${apiUrl}/${cleanPath}`
}

