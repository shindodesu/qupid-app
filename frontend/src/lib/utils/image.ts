/**
 * 画像URLを構築するヘルパー関数
 */

// 実行時に環境変数を取得（クライアント側でのみ有効）
function getApiUrl(): string {
  // クライアント側とサーバー側の両方で環境変数から取得
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  // 環境変数が空文字列やundefinedの場合はデフォルト値を使用
  if (!apiUrl || apiUrl.trim() === '') {
    console.warn('[getApiUrl] NEXT_PUBLIC_API_URL is not set, using default:', 'http://localhost:8000')
    return 'http://localhost:8000'
  }
  
  // 末尾のスラッシュを削除
  return apiUrl.replace(/\/$/, '')
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
  console.log('[getAvatarUrl] Constructed URL:', fullUrl)
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

