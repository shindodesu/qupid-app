import { apiClient } from './index'
import type {
  UserSearchResponse,
  UserSuggestionsResponse,
  SearchFilters,
  SendLikeRequest,
  SendLikeResponse,
  DiscoverFilters,
} from '@/types/search'

// APIエラークラス
export class SearchApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'SearchApiError'
  }
}

// 検索関連のAPI
export const searchApi = {
  /**
   * ユーザー検索
   */
  async searchUsers(filters: SearchFilters = {}): Promise<UserSearchResponse> {
    try {
      const params = new URLSearchParams()
      
      // タグ（カンマ区切り）
      if (filters.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','))
      }
      
      // 学部
      if (filters.faculty) {
        params.append('faculty', filters.faculty)
      }
      
      // 学年
      if (filters.grade) {
        params.append('grade', filters.grade)
      }
      
      // フリーテキスト検索
      if (filters.search) {
        params.append('search', filters.search)
      }
      
      // 並び順
      if (filters.sort) {
        params.append('sort', filters.sort)
      }
      
      // ページネーション
      if (filters.limit) {
        params.append('limit', String(filters.limit))
      }
      
      if (filters.offset !== undefined) {
        params.append('offset', String(filters.offset))
      }
      
      const queryString = params.toString()
      const endpoint = queryString ? `/users/search?${queryString}` : '/users/search'
      
      return await apiClient.get<UserSearchResponse>(endpoint)
    } catch (error: any) {
      throw new SearchApiError(
        error.message || 'ユーザー検索に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * おすすめユーザー取得
   */
  async getSuggestions(limit: number = 10, filters?: DiscoverFilters): Promise<UserSuggestionsResponse> {
    try {
      const params = new URLSearchParams()
      params.append('limit', String(limit))
      
      // Discoverフィルターの追加
      if (filters) {
        if (filters.sexuality && filters.sexuality.length > 0) {
          params.append('sexuality', filters.sexuality.join(','))
        }
        
        if (filters.relationship_goal) {
          params.append('relationship_goal', filters.relationship_goal)
        }
        
        if (filters.sex && filters.sex.length > 0) {
          params.append('sex', filters.sex.join(','))
        }
        
        if (filters.gender_range) {
          params.append('gender_min', String(filters.gender_range.min))
          params.append('gender_max', String(filters.gender_range.max))
        }
        
        if (filters.age_min !== undefined) {
          params.append('age_min', String(filters.age_min))
        }
        
        if (filters.age_max !== undefined) {
          params.append('age_max', String(filters.age_max))
        }
      }
      
      const endpoint = `/users/suggestions?${params.toString()}`
      return await apiClient.get<UserSuggestionsResponse>(endpoint)
    } catch (error: any) {
      throw new SearchApiError(
        error.message || 'おすすめユーザーの取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * いいね送信
   */
  async sendLike(userId: number): Promise<SendLikeResponse> {
    try {
      const data: SendLikeRequest = {
        liked_user_id: userId,
      }
      return await apiClient.post<SendLikeResponse>('/likes', data)
    } catch (error: any) {
      throw new SearchApiError(
        error.message || 'いいねの送信に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * いいね取り消し
   */
  async removeLike(userId: number): Promise<void> {
    try {
      await apiClient.delete(`/likes/${userId}`)
    } catch (error: any) {
      throw new SearchApiError(
        error.message || 'いいねの取り消しに失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * 送信したいいね一覧
   */
  async getSentLikes(): Promise<any> {
    try {
      return await apiClient.get('/likes/sent')
    } catch (error: any) {
      throw new SearchApiError(
        error.message || '送信したいいね一覧の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * 受け取ったいいね一覧
   */
  async getReceivedLikes(): Promise<any> {
    try {
      return await apiClient.get('/likes/received')
    } catch (error: any) {
      throw new SearchApiError(
        error.message || '受け取ったいいね一覧の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * マッチ一覧取得
   */
  async getMatches(): Promise<any> {
    try {
      return await apiClient.get('/matches')
    } catch (error: any) {
      throw new SearchApiError(
        error.message || 'マッチ一覧の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },
}

