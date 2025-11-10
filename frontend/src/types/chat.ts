/**
 * チャット関連の型定義
 */

// 会話タイプ
export type ConversationType = 'direct' | 'group'

// ユーザー基本情報
export interface UserInfo {
  id: number
  display_name: string
  bio?: string | null
  avatar_url?: string | null
  is_online: boolean
  last_seen_at?: string | null
}

// メッセージタイプ
export type MessageType = 'text' | 'voice' | 'image'

// メッセージ
export interface Message {
  id: number
  content: string
  sender_id: number
  sender_name: string
  is_read: boolean
  created_at: string
  message_type: MessageType
  file_path?: string | null
  file_size?: number | null
  duration_seconds?: number | null
}

// 最後のメッセージ
export interface LastMessage {
  id: number
  content: string
  sender_id: number
  created_at: string
  is_read: boolean
}

// 会話
export interface Conversation {
  id: number
  type: ConversationType
  title?: string | null
  other_user: UserInfo
  last_message?: LastMessage | null
  unread_count: number
  created_at: string
  updated_at: string
}

// 会話詳細
export interface ConversationDetail {
  id: number
  type: ConversationType
  title?: string | null
  other_user: UserInfo
  created_at: string
}

// 会話一覧レスポンス
export interface ConversationListResponse {
  conversations: Conversation[]
  total: number
  limit: number
  offset: number
}

// メッセージ一覧レスポンス
export interface MessageListResponse {
  messages: Message[]
  total: number
  limit: number
  offset: number
}

// 未読数レスポンス
export interface UnreadCountResponse {
  unread_count: number
}

// 既読マークレスポンス
export interface MessageReadResponse {
  message: string
  message_id: number
}

// 会話作成リクエスト
export interface ConversationCreateRequest {
  other_user_id: number
}

// メッセージ送信リクエスト
export interface MessageCreateRequest {
  content: string
  message_type?: MessageType
  file_path?: string | null
  file_size?: number | null
  duration_seconds?: number | null
}

