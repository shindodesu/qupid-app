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
  avatar_url?: string
  faculty?: string
  grade?: string
  tags: TagInfo[]
  match_score: number
  reason: string
  has_received_like?: boolean
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

// Discoverフィルター
export interface DiscoverFilters {
  sexuality?: Sexuality[]
  relationship_goal?: RelationshipGoal
  sex?: Sex[]
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
  message: string | null
  like: {
    id: number
    liker_id: number
    liked_id: number
    created_at: string
  }
  is_match: boolean
  match?: {
    id: number
    user: {
      id: number
      email?: string | null
      display_name: string
      bio?: string | null
      avatar_url?: string | null
      campus?: string | null
      faculty?: string | null
      grade?: string | null
      birthday?: string | null
      gender?: string | null
      sexuality?: string | null
      looking_for?: string | null
      profile_completed?: boolean
      is_active?: boolean
      created_at?: string
      show_faculty?: boolean
      show_grade?: boolean
      show_birthday?: boolean
      show_age?: boolean
      show_gender?: boolean
      show_sexuality?: boolean
      show_looking_for?: boolean
      show_bio?: boolean
      show_tags?: boolean
      tags?: TagInfo[]
    }
    matched_at: string
    conversation_id?: number | null
  } | null
}

