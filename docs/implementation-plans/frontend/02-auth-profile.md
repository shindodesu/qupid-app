# フロントエンド実装計画書: 認証・プロフィール

## 📋 概要
本書は、Qupid フロントエンドにおける「認証」「プロフィール登録/編集」「タグ管理」の実装計画を示す。Figmaデザイン（`docs/images`）を参照し、匿名性・安全性・使いやすさを満たすUI/UXを前提とする。

## 🎯 目的
- 九州大学メールによるログイン（暫定はID/PW＋JWT）
- 初回プロフィール登録フローの実現（表示名、学部、学年、自己紹介、タグ）
- プロフィール閲覧/編集、自己タグ管理
- 非ログイン時のアクセス制御と保護ページ

## 🧩 画面/ルート
- `/login` ログイン
- `/register` 初回登録（プロフィールセットアップウィザード）
- `/profile` 自分のプロフィール表示
- `/profile/edit` プロフィール編集（インラインでも可）

App Router 配下での構成案:
```
src/app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    profile/page.tsx
    profile/edit/page.tsx
```

## 🛠️ 技術要素
- 認証: NextAuth.js（JWT strategy） or カスタムJWT（MVP）。バックエンドの `POST /auth/login` と整合。
- 状態: Zustand（`authStore`、`userStore`）
- データ取得: React Query（セッション・プロフィールのフェッチ/更新）
- フォーム: React Hook Form + Zod
- UI: Tailwind + Headless UI（モーダル/ドロップダウン）

## 🔌 API I/F（バックエンド整合）
- POST `/auth/login` ログイン
- GET `/users/me` 自分の情報
- PUT `/users/me` プロフィール更新
- GET `/users/me/tags` 自分のタグ
- POST `/users/me/tags` 追加、DELETE `/users/me/tags/{tag_id}` 削除

## 🧱 データ型（フロント側）
```ts
// src/types/user.ts
export type User = {
  id: number
  email: string
  display_name: string
  bio?: string
  faculty?: string
  grade?: string
  tags?: { id: number; name: string; description?: string }[]
  created_at?: string
  updated_at?: string
}

export type UserUpdate = Partial<Pick<User, 'display_name' | 'bio' | 'faculty' | 'grade'>>

export type LoginPayload = { email: string; password: string }
```

## 🧭 ユースケース/フロー
1) 非ログイン → `/login` 表示 → 認証成功 → 初回なら `/register`、既存なら `/profile` へ遷移
2) `/register` でプロフィール必須項目を入力（進捗ステップ UI）→ 保存 → `/profile`
3) `/profile` 表示からタグの追加/削除、`/profile/edit` で詳細編集

ガード:
- 保護ルートはセッション検証（SSR or クライアント）
- 非ログイン時は `/login` リダイレクト

## 🧪 バリデーション
Zod スキーマ例:
```ts
// src/lib/validations.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const profileSchema = z.object({
  display_name: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
  faculty: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
})
```

## 🧰 コンポーネント
- フォーム: `LoginForm`, `ProfileForm`
- UI: `Button`, `Input`, `Select`, `TagBadge`, `TagInput`
- レイアウト: `ProtectedRoute`（App Routerでは`generateMetadata`やサーバー側での検証も採用）

## 🧵 状態管理
```ts
// src/stores/authStore.ts（概要）
// - token/JWT、user、isAuthenticated
// - login/logout、session restore

// src/stores/userStore.ts（概要）
// - me（User）
// - fetchMe/updateMe、tag操作
```

## 🔄 React Query キー設計
- `['me']` 自分情報
- `['me','tags']` 自分タグ

## 🧪 テスト
- 単体: バリデーション、フォーム送信、状態遷移
- 統合: ログイン→登録→プロフィール表示のフロー
- E2E: `/login` → `/register` → `/profile`

## 🔒 セキュリティ/プライバシー
- JWT保存は`httpOnly`クッキー（推奨） or `sessionStorage`（MVP）
- XSS対策（出力エスケープ、危険なHTML不使用）
- メールはUI非表示（プロフィールには含めない）

## 📈 成功指標
- フロー成功率 > 95%
- ログイン→プロフィール表示まで < 3s（P95）
- テストカバレッジ > 80%

## 📋 実装チェックリスト
- [ ] `/login` 画面/フォーム/エラー表示
- [ ] 認証API接続・トークン保持
- [ ] 初回登録ウィザード（`/register`）
- [ ] `/users/me` 取得・キャッシュ
- [ ] プロフィール編集（保存/差分UI）
- [ ] 自己タグ追加/削除UI
- [ ] 保護ルート/リダイレクト
- [ ] 単体/統合/E2Eテスト

---
作成日: 2025-10-13 / 担当: Qupid開発チーム



