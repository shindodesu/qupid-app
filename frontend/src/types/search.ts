/**
 * 検索・マッチング関連の型定義
 */

// タグ情報
export interface TagInfo {
  id: number
  name: string
  description?: string
}

// いいね状態
export interface LikeStatus {
  i_liked: boolean
  they_liked: boolean
  is_matched: boolean
}

// ユーザー検索結果
export interface UserSearchResult {
  id: number
  display_name: string
  bio?: string
  faculty?: string
  grade?: string
  tags: TagInfo[]
  created_at: string
  like_status: LikeStatus
}

// ユーザー検索レスポンス
export interface UserSearchResponse {
  users: UserSearchResult[]
  total: number
  limit: number
  offset: number
  filters_applied: Record<string, any>
}

// おすすめユーザー
export interface UserSuggestion {
  id: number
  display_name: string
  bio?: string
  faculty?: string
  grade?: string
  tags: TagInfo[]
  match_score: number
  reason: string
}

// おすすめユーザーレスポンス
export interface UserSuggestionsResponse {
  users: UserSuggestion[]
  total: number
  limit: number
}

// 並び順
export type SortOrder = 'recent' | 'popular' | 'alphabetical'

// 検索フィルター
export interface SearchFilters {
  tags?: string[]
  faculty?: string
  grade?: string
  search?: string
  sort?: SortOrder
  limit?: number
  offset?: number
}

// いいね送信リクエスト
export interface SendLikeRequest {
  liked_user_id: number
}

// いいね送信レスポンス
export interface SendLikeResponse {
  message: string
  is_match: boolean
  match_id?: number
}

