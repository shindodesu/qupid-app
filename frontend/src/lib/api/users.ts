import { apiClient } from './index'
import type { UserProfile } from '@/types/user'

export class UsersApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'UsersApiError'
  }
}

export const usersApi = {
  async getUserProfile(userId: number): Promise<UserProfile> {
    try {
      return await apiClient.get<UserProfile>(`/users/${userId}`)
    } catch (error: any) {
      throw new UsersApiError(
        error.message || 'ユーザー情報の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },
}


