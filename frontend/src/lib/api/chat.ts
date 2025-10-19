import { apiClient } from './index'
import type {
  Conversation,
  ConversationListResponse,
  ConversationDetail,
  ConversationCreateRequest,
  Message,
  MessageListResponse,
  MessageCreateRequest,
  UnreadCountResponse,
  MessageReadResponse,
  MessageType,
} from '@/types/chat'

// APIエラークラス
export class ChatApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ChatApiError'
  }
}

// チャット関連のAPI
export const chatApi = {
  /**
   * 会話一覧を取得
   */
  async getConversations(
    limit: number = 20,
    offset: number = 0
  ): Promise<ConversationListResponse> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })
      return await apiClient.get<ConversationListResponse>(
        `/conversations?${params}`
      )
    } catch (error: any) {
      throw new ChatApiError(
        error.message || '会話一覧の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * 会話を作成
   */
  async createConversation(
    otherUserId: number
  ): Promise<ConversationDetail> {
    try {
      const data: ConversationCreateRequest = {
        other_user_id: otherUserId,
      }
      return await apiClient.post<ConversationDetail>('/conversations', data)
    } catch (error: any) {
      throw new ChatApiError(
        error.message || '会話の作成に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * メッセージ履歴を取得
   */
  async getMessages(
    conversationId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessageListResponse> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })
      return await apiClient.get<MessageListResponse>(
        `/conversations/${conversationId}/messages?${params}`
      )
    } catch (error: any) {
      throw new ChatApiError(
        error.message || 'メッセージの取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * メッセージを送信
   */
  async sendMessage(
    conversationId: number,
    content: string,
    messageType: MessageType = 'text',
    filePath?: string,
    fileSize?: number,
    durationSeconds?: number
  ): Promise<Message> {
    try {
      const data: MessageCreateRequest = {
        content,
        message_type: messageType,
        file_path: filePath,
        file_size: fileSize,
        duration_seconds: durationSeconds,
      }
      return await apiClient.post<Message>(
        `/conversations/${conversationId}/messages`,
        data
      )
    } catch (error: any) {
      throw new ChatApiError(
        error.message || 'メッセージの送信に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * メッセージを既読にする
   */
  async markMessageAsRead(
    conversationId: number,
    messageId: number
  ): Promise<MessageReadResponse> {
    try {
      return await apiClient.put<MessageReadResponse>(
        `/conversations/${conversationId}/messages/${messageId}/read`
      )
    } catch (error: any) {
      throw new ChatApiError(
        error.message || '既読マークに失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * 未読メッセージ数を取得
   */
  async getUnreadCount(conversationId: number): Promise<UnreadCountResponse> {
    try {
      return await apiClient.get<UnreadCountResponse>(
        `/conversations/${conversationId}/unread-count`
      )
    } catch (error: any) {
      throw new ChatApiError(
        error.message || '未読数の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * オンライン状態を更新
   */
  async updateOnlineStatus(isOnline: boolean): Promise<{ message: string; is_online: boolean }> {
    try {
      return await apiClient.put<{ message: string; is_online: boolean }>(
        '/conversations/users/online-status',
        { is_online: isOnline }
      )
    } catch (error: any) {
      throw new ChatApiError(
        error.message || 'オンライン状態の更新に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * ユーザーのオンライン状態を取得
   */
  async getUserOnlineStatus(userId: number): Promise<{ user_id: number; is_online: boolean; last_seen_at: string | null }> {
    try {
      return await apiClient.get<{ user_id: number; is_online: boolean; last_seen_at: string | null }>(
        `/conversations/users/${userId}/online-status`
      )
    } catch (error: any) {
      throw new ChatApiError(
        error.message || 'オンライン状態の取得に失敗しました',
        error.status,
        error.code
      )
    }
  },
}

