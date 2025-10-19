# フロントエンド実装計画書: 検索・マッチング

## 📋 概要
ユーザー検索、フィルタリング、いいね送信、マッチ一覧・状態確認をフロントで実装する計画。

## 🔌 対応API
- GET `/users/search`（タグ/属性/テキスト/ページネーション/ソート）
- GET `/users/suggestions`（おすすめ）
- POST `/likes`（いいね）
- GET `/likes/sent`, `/likes/received`
- GET `/matches`, `/matches/{user_id}`
- DELETE `/likes/{liked_user_id}`（取り消し）

## 🧭 画面/ルート
- `/home` Discover画面（ユーザーカードのスワイプ機能）
- `/search` 検索画面（フィルター・結果リスト）
- `/matches` マッチ一覧

## 🧱 データ型（フロント）
```ts
// src/types/search.ts
export type TagInfo = { id: number; name: string; description?: string }

export type LikeStatus = { i_liked: boolean; they_liked: boolean; is_matched: boolean }

export type UserSearchResult = {
  id: number
  display_name: string
  bio?: string
  faculty?: string
  grade?: string
  tags: TagInfo[]
  created_at: string
  like_status: LikeStatus
}

export type UserSearchResponse = {
  users: UserSearchResult[]
  total: number
  limit: number
  offset: number
  filters_applied: Record<string, unknown>
}
```

## 🧰 コンポーネント
- `DiscoverUserCard`（プロフィールカード、スワイプ機能、いいね・スキップボタン）
- `SearchForm`（テキスト/タグ/学部/学年/ソート）
- `UserCard`（プロフィール要約、タグ、いいねボタン）
- `Pagination`（ページング）
- `FiltersSheet`（モバイル用シートUI）
- `MatchUserCard`（マッチ相手の要約）

## 🔄 React Query キー
- `['search', params]` 検索結果
- `['matches']` マッチ一覧
- `['likes','sent']`, `['likes','received']` 履歴

## 🧠 いいね動作（UX）
- いいね押下時: 楽観的更新→API→失敗時ロールバック
- マッチ成立時: トースト表示＋`/matches` への案内
- 取り消し: 確認モーダル＋結果反映

## 🧮 クエリパラメータ設計
`/search?tags=映画,ゲーム&faculty=工学部&grade=3年生&search=...&sort=recent&limit=20&offset=0`

URL同期:
- App Router の `useSearchParams`/`useRouter` で同期し、共有可能なリンク

## 📱 レスポンシブ
- モバイル: フィルターはSheet/Drawer、カードは1カラム
- タブレット/PC: サイドバー＋2-4カラムカード

## 🧪 テスト
- 検索条件→結果の反映
- ページネーション/ソートの反映
- いいね送信の成功/失敗/マッチ成立
- マッチ一覧表示

## 🔒 セキュリティ/考慮
- ブロック済みユーザー非表示（API側が除外、UIは状態に追随）
- 非ログイン時は `/login` リダイレクト

## 📈 成功指標
- 検索応答 < 1s（キャッシュヒット時 < 300ms）
- いいね操作成功率 > 99%
- E2Eグリーン > 95%

## 📋 実装チェックリスト
- [x] `DiscoverUserCard` コンポーネント実装
- [x] Discoverページ実装（スワイプ機能付き）
- [x] いいね・スキップ機能実装
- [x] ナビゲーション更新（ホーム→Discover）
- [ ] `SearchForm` とURL同期
- [ ] 検索API接続/無限スクロール or ページネーション
- [ ] `UserCard` いいね実装（楽観的更新）
- [ ] マッチ一覧/状態確認
- [ ] 送受信いいね履歴表示
- [ ] テスト（単体/統合/E2E）

---
作成日: 2025-10-13 / 担当: Qupid開発チーム



