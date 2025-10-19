/**
 * アプリケーション定数
 */

// API設定
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30秒
} as const

// ページネーション設定
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  CHAT_MESSAGE_LIMIT: 50,
  CONVERSATION_LIMIT: 20,
} as const

// キャッシュ設定（ミリ秒）
export const CACHE_TIME = {
  SHORT: 1 * 60 * 1000, // 1分
  MEDIUM: 5 * 60 * 1000, // 5分
  LONG: 10 * 60 * 1000, // 10分
  VERY_LONG: 30 * 60 * 1000, // 30分
} as const

// リフレッシュ間隔（ミリ秒）
export const REFETCH_INTERVAL = {
  MESSAGES: 5000, // 5秒
  CONVERSATIONS: 10000, // 10秒
  NOTIFICATIONS: 30000, // 30秒
} as const

// バリデーション設定
export const VALIDATION = {
  DISPLAY_NAME_MIN: 1,
  DISPLAY_NAME_MAX: 100,
  BIO_MAX: 1000,
  MESSAGE_MAX: 4000,
  REPORT_REASON_MAX: 1000,
  PASSWORD_MIN: 6,
  TAG_NAME_MAX: 50,
} as const

// ルート定義
export const ROUTES = {
  HOME: '/home',
  MATCHES: '/matches',
  CHAT: '/chat',
  PROFILE: '/profile',
  SAFETY: '/safety',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
} as const

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  AUTH_ERROR: '認証に失敗しました',
  NOT_FOUND: 'リソースが見つかりませんでした',
  PERMISSION_DENIED: '権限がありません',
  VALIDATION_ERROR: '入力内容に誤りがあります',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
} as const

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'プロフィールを更新しました',
  LIKE_SENT: 'いいねを送信しました',
  MATCH_CREATED: 'マッチしました！',
  MESSAGE_SENT: 'メッセージを送信しました',
  REPORT_SUBMITTED: '通報を送信しました',
  BLOCK_CREATED: 'ブロックしました',
  BLOCK_REMOVED: 'ブロックを解除しました',
} as const

// ローカルストレージキー
export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  THEME: 'theme',
  PREFERENCES: 'user-preferences',
} as const

// React Queryキー
export const QUERY_KEYS = {
  ME: ['user', 'me'] as const,
  USER_TAGS: ['user', 'me', 'tags'] as const,
  TAGS: ['tags'] as const,
  SUGGESTIONS: ['suggestions'] as const,
  MATCHES: ['matches'] as const,
  CONVERSATIONS: ['conversations'] as const,
  CONVERSATION: (id: number) => ['conversation', id] as const,
  MESSAGES: (id: number) => ['messages', id] as const,
  REPORTS: ['reports', 'my'] as const,
  BLOCKS: ['blocks', 'my'] as const,
} as const

