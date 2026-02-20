# 検索・マッチング機能 実装ドキュメント

## 📋 概要

このドキュメントでは、Qupidアプリの検索・マッチング機能の実装について説明します。

## 🎯 実装された機能

### 1. ユーザー検索機能
- タグでの絞り込み検索
- 学部・学年でのフィルタリング
- フリーテキスト検索（表示名・自己紹介）
- 並び順の変更（新しい順・名前順・人気順）
- ページネーション対応
- URL同期（検索条件の共有可能）

### 2. いいね・マッチング機能
- いいね送信
- いいね取り消し
- マッチ状態の表示
- マッチ通知
- **探す画面**: すでにいいねを送ったユーザーは表示しない（検索・suggestions で除外）
- **マッチ成立時**: トークルームを自動生成

### 3. おすすめユーザー機能
- 共通タグに基づくおすすめ
- マッチスコア表示
- おすすめ理由の表示

### 4. UI/UXの実装
- レスポンシブデザイン（モバイル・タブレット・デスクトップ対応）
- カード形式のユーザー表示
- タグバッジ表示
- ローディング状態の表示
- エラーハンドリング

## 📁 ファイル構造

```
frontend/src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx           # ダッシュボードレイアウト（認証ガード付き）
│   │   ├── home/
│   │   │   └── page.tsx         # ホームページ（おすすめユーザー表示）
│   │   ├── search/
│   │   │   └── page.tsx         # 検索ページ（メイン機能）
│   │   ├── matches/
│   │   │   └── page.tsx         # マッチ一覧ページ
│   │   ├── profile/
│   │   │   └── page.tsx         # プロフィールページ
│   │   └── chat/
│   │       └── page.tsx         # チャットページ（準備中）
│   └── layout.tsx               # ルートレイアウト
├── components/
│   ├── features/
│   │   └── search/
│   │       ├── UserCard.tsx     # ユーザーカードコンポーネント
│   │       ├── SearchForm.tsx   # 検索フォームコンポーネント
│   │       ├── UserList.tsx     # ユーザーリストコンポーネント
│   │       ├── Pagination.tsx   # ページネーションコンポーネント
│   │       └── index.ts         # エクスポート
│   ├── layout/
│   │   └── DashboardNav.tsx     # ダッシュボードナビゲーション
│   ├── providers/
│   │   ├── QueryProvider.tsx    # React Query Provider
│   │   ├── AuthProvider.tsx     # 認証Provider
│   │   └── index.ts             # エクスポート
│   └── ui/                      # UIコンポーネント（Button, Card, Input等）
├── lib/
│   └── api/
│       ├── search.ts            # 検索API関数
│       └── index.ts             # APIクライアント
└── types/
    └── search.ts                # 検索関連の型定義
```

## 🔌 APIエンドポイント

### 検索関連
- `GET /users/search` - ユーザー検索
  - クエリパラメータ: tags, faculty, grade, search, sort, limit, offset
- `GET /users/suggestions` - おすすめユーザー取得
  - クエリパラメータ: limit

### いいね・マッチング関連
- `POST /likes` - いいね送信
- `DELETE /likes/{user_id}` - いいね取り消し
- `GET /likes/sent` - 送信したいいね一覧
- `GET /likes/received` - 受け取ったいいね一覧
- `GET /matches` - マッチ一覧

## 🚀 使用方法

### 開発環境の起動

```bash
# フロントエンド
cd frontend
npm run dev

# バックエンド（別ターミナル）
cd ..
docker-compose up
```

### 検索機能の使用

1. `/search` にアクセス
2. 検索フォームで条件を入力
3. 「検索」ボタンをクリック
4. 検索結果が表示される
5. ユーザーカードの「いいね」ボタンをクリックしていいね送信
6. 両想いの場合、マッチ成立

### おすすめユーザーの表示

1. `/home` にアクセス
2. おすすめユーザーセクションに共通タグを持つユーザーが表示される
3. マッチスコアと理由が表示される

## 🎨 コンポーネントの使用例

### UserCard

```tsx
import { UserCard } from '@/components/features/search'

<UserCard
  user={user}
  onLike={async (userId) => await sendLike(userId)}
  onUnlike={async (userId) => await removeLike(userId)}
/>
```

### SearchForm

```tsx
import { SearchForm } from '@/components/features/search'

<SearchForm
  onSearch={(filters) => handleSearch(filters)}
  initialFilters={filters}
  availableTags={tags}
/>
```

### UserList

```tsx
import { UserList } from '@/components/features/search'

<UserList
  users={users}
  onLike={handleLike}
  onUnlike={handleUnlike}
  isLoading={isLoading}
/>
```

## 🧪 テスト

```bash
# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e
```

## 📝 注意事項

### セキュリティ
- 検索は認証済みユーザーのみ
- 自分のプロフィールは検索結果に含まれない
- ブロックしたユーザー・ブロックされたユーザーは検索結果から除外

### パフォーマンス
- React Queryによるキャッシュ機能
- ページネーションによる効率的なデータ取得
- 楽観的更新によるUX向上

### 将来の拡張
- 無限スクロール対応
- リアルタイム通知
- 高度なフィルター機能
- 位置情報ベースの検索

## 🐛 トラブルシューティング

### 検索結果が表示されない
- バックエンドAPIが起動しているか確認
- 認証トークンが有効か確認
- ブラウザのコンソールでエラーを確認

### いいねが送信できない
- ユーザーが既にブロック済みでないか確認
- 既にいいね済みでないか確認
- ネットワーク接続を確認

### 「いいねの送信に失敗しました」と出るが実際には送信できている場合
- 受け取ったいいねに「いいねを返す」を押したとき、二重送信や表示遅延によりバックエンドが 400 "You have already liked this user" を返すことがある。フロントではこの場合を成功扱いとし、エラーアラートを出さず一覧を更新して次に進むように修正済み（`dev_tools/check_like_issue.md` 参照）。

## 📚 参考資料

- [実装計画書: ユーザー検索](../../docs/implementation-plans/03-user-search.md)
- [実装計画書: フロントエンド検索・マッチング](../../docs/implementation-plans/frontend/03-user-search-matching.md)
- [要件定義書](../../docs/requirements.md)

## 👥 開発者

Qupid開発チーム

## 📅 更新履歴

- 2025-10-15: 検索・マッチング機能実装完了

