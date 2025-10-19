import { z } from 'zod'

// 認証関連のバリデーション
export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください')
    .refine((email) => email.endsWith('@s.kyushu-u.ac.jp'), '九州大学のメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
})

// プロフィール関連のバリデーション
export const profileSchema = z.object({
  display_name: z.string().min(1, '表示名を入力してください').max(100, '表示名は100文字以内で入力してください'),
  bio: z.string().max(1000, '自己紹介は1000文字以内で入力してください').optional(),
  faculty: z.string().max(100, '学部名は100文字以内で入力してください').optional(),
  grade: z.string().max(50, '学年は50文字以内で入力してください').optional(),
})

// タグ関連のバリデーション
export const tagSchema = z.object({
  name: z.string().min(1, 'タグ名を入力してください').max(64, 'タグ名は64文字以内で入力してください'),
  description: z.string().max(255, '説明は255文字以内で入力してください').optional(),
})

// 検索関連のバリデーション
export const searchSchema = z.object({
  tags: z.string().optional(),
  faculty: z.string().optional(),
  grade: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort: z.enum(['recent', 'popular', 'alphabetical']).default('recent'),
})

// メッセージ関連のバリデーション
export const messageSchema = z.object({
  content: z.string().min(1, 'メッセージを入力してください').max(4000, 'メッセージは4000文字以内で入力してください'),
})

// 通報関連のバリデーション
export const reportSchema = z.object({
  target_user_id: z.number().positive('有効なユーザーIDを入力してください'),
  reason: z.string().min(1, '通報理由を入力してください').max(1000, '通報理由は1000文字以内で入力してください'),
})

// ブロック関連のバリデーション
export const blockSchema = z.object({
  blocked_user_id: z.number().positive('有効なユーザーIDを入力してください'),
})

// 型のエクスポート
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type TagInput = z.infer<typeof tagSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ReportInput = z.infer<typeof reportSchema>
export type BlockInput = z.infer<typeof blockSchema>
