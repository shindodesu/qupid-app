/**
 * セーフティ（通報・ブロック）関連の型定義
 */

// 通報ステータス
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'rejected'

// ユーザー基本情報
export interface UserInfo {
  id: number
  display_name: string
}

// 通報作成リクエスト
export interface ReportCreateRequest {
  target_user_id: number
  reason: string
}

// 通報情報
export interface Report {
  id: number
  target_user?: UserInfo | null
  reason: string
  status: ReportStatus
  admin_note?: string | null
  created_at: string
  updated_at: string
}

// 通報詳細（管理者用）
export interface ReportDetail {
  id: number
  reporter?: UserInfo | null
  target_user?: UserInfo | null
  reason: string
  status: ReportStatus
  admin_note?: string | null
  created_at: string
  updated_at: string
}

// 通報作成レスポンス
export interface ReportResponse {
  id: number
  target_user_id: number
  target_user_name: string
  reason: string
  status: ReportStatus
  created_at: string
  message: string
}

// 通報一覧レスポンス
export interface ReportListResponse {
  reports: Report[]
  total: number
  limit: number
  offset: number
}

// 管理者用通報一覧レスポンス
export interface AdminReportListResponse {
  reports: ReportDetail[]
  total: number
  limit: number
  offset: number
}

// 通報ステータス更新リクエスト
export interface ReportStatusUpdateRequest {
  status: ReportStatus
  admin_note?: string | null
}

// 通報ステータス更新レスポンス
export interface ReportStatusUpdateResponse {
  id: number
  status: ReportStatus
  admin_note?: string | null
  updated_at: string
  message: string
}

// ブロック作成リクエスト
export interface BlockCreateRequest {
  blocked_user_id: number
}

// ブロック情報
export interface Block {
  id: number
  blocked_user: UserInfo
  created_at: string
}

// ブロック作成レスポンス
export interface BlockResponse {
  id: number
  blocked_user: UserInfo
  created_at: string
  message: string
}

// ブロック一覧レスポンス
export interface BlockListResponse {
  blocks: Block[]
  total: number
  limit: number
  offset: number
}

// ブロック解除レスポンス
export interface BlockRemoveResponse {
  message: string
  blocked_user_id: number
}

