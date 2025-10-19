import { apiClient } from './index'
import type {
  ReportCreateRequest,
  ReportResponse,
  Report,
  ReportListResponse,
  BlockCreateRequest,
  BlockResponse,
  Block,
  BlockListResponse,
  BlockRemoveResponse,
} from '@/types/safety'

// APIエラークラス
export class SafetyApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'SafetyApiError'
  }
}

// セーフティ関連のAPI
export const safetyApi = {
  /**
   * ユーザーを通報
   */
  async reportUser(
    targetUserId: number,
    reason: string
  ): Promise<ReportResponse> {
    try {
      const data: ReportCreateRequest = {
        target_user_id: targetUserId,
        reason,
      }
      return await apiClient.post<ReportResponse>('/reports', data)
    } catch (error: any) {
      throw new SafetyApiError(
        error.message || 'ユーザーの通報に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * 自分の通報一覧を取得
   */
  async getMyReports(
    limit: number = 20,
    offset: number = 0
  ): Promise<ReportListResponse> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })
      return await apiClient.get<ReportListResponse>(`/reports/my?${params}`)
    } catch (error: any) {
      throw new SafetyApiError(
        error.message || '通報一覧の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * 通報詳細を取得
   */
  async getReportDetail(reportId: number): Promise<Report> {
    try {
      return await apiClient.get<Report>(`/reports/${reportId}`)
    } catch (error: any) {
      throw new SafetyApiError(
        error.message || '通報詳細の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * ユーザーをブロック
   */
  async blockUser(blockedUserId: number): Promise<BlockResponse> {
    try {
      const data: BlockCreateRequest = {
        blocked_user_id: blockedUserId,
      }
      return await apiClient.post<BlockResponse>('/blocks', data)
    } catch (error: any) {
      throw new SafetyApiError(
        error.message || 'ユーザーのブロックに失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * 自分のブロック一覧を取得
   */
  async getMyBlocks(
    limit: number = 20,
    offset: number = 0
  ): Promise<BlockListResponse> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })
      return await apiClient.get<BlockListResponse>(`/blocks/my?${params}`)
    } catch (error: any) {
      throw new SafetyApiError(
        error.message || 'ブロック一覧の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * ブロックを解除
   */
  async unblockUser(blockedUserId: number): Promise<BlockRemoveResponse> {
    try {
      return await apiClient.delete<BlockRemoveResponse>(
        `/blocks/${blockedUserId}`
      )
    } catch (error: any) {
      throw new SafetyApiError(
        error.message || 'ブロックの解除に失敗しました',
        error.status,
        error.code
      )
    }
  },
}

