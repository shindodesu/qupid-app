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

// フィルター関連の型定義
export type Sexuality = 'lesbian' | 'bisexual' | 'transgender' | 'gay' | 'asexual' | 'pansexual' | 'other'
export type Gender = 'man' | 'woman' | 'non-binary' | 'transgender' | 'other'
export type RelationshipGoal = 'friends' | 'dating' | 'all'
export type Sex = 'male' | 'female' | 'other'

// ジェンダー範囲
export interface GenderRange {
  min: number // 0-100の範囲で、0がMan、100がWoman
  max: number
}

// Discoverフィルター
export interface DiscoverFilters {
  sexuality?: Sexuality[]
  relationship_goal?: RelationshipGoal
  sex?: Sex[]
  gender_range?: GenderRange
  age_min?: number
  age_max?: number
}

// 検索フィルター
export interface SearchFilters {
  tags?: string[]
  faculty?: string
  grade?: string
  search?: string
  sort?: SortOrder
  limit?: number
  offset?: number
  // Discoverフィルターを統合
  discover?: DiscoverFilters
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

