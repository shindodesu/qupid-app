/**
 * 画像URLを構築するヘルパー関数
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  
  console.log('[getAvatarUrl] Input:', avatarUrl)
  
  // 既に完全なURLの場合はそのまま返す
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    console.log('[getAvatarUrl] Already full URL, returning as-is:', avatarUrl)
    return avatarUrl
  }
  
  // 相対パスの場合、APIのベースURLを追加
  // 先頭のスラッシュを削除して結合
  const cleanPath = avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl
  const fullUrl = `${API_URL}/${cleanPath}`
  console.log('[getAvatarUrl] Constructed URL:', fullUrl)
  return fullUrl
}

/**
 * 画像ファイルのURLを取得（汎用）
 * @param filePath - ファイルパス
 * @returns 完全なURL
 */
export function getImageUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null
  
  // 既に完全なURLの場合はそのまま返す
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }
  
  // 相対パスの場合、APIのベースURLを追加
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
  return `${API_URL}/${cleanPath}`
}

