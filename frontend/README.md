# Qupid フロントエンド

九州大学のLGBTQ+当事者学生向けマッチングアプリ「Qupid」のフロントエンドアプリケーションです。

## 🎯 プロジェクト概要

Qupidは、九州大学の学生が安全で快適にマッチングできるWebアプリケーションです。タグベースのマッチングシステムを採用し、共通の趣味や興味を持つ人とつながることができます。

## ✨ 主要機能

- 🔐 **認証**: 九州大学メールアドレスでの登録・ログイン
- 👤 **プロフィール**: 詳細なプロフィール作成・編集、タグ管理
- 🔍 **検索**: タグ・学部・学年でのユーザー検索
- 💕 **マッチング**: いいね送信、両想いでマッチング成立
- 💬 **チャット**: マッチしたユーザーとの1対1メッセージング
- 🛡️ **セーフティ**: 通報・ブロック機能

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript 5
- **スタイリング**: Tailwind CSS 4
- **状態管理**: Zustand 5
- **データ取得**: TanStack Query (React Query) 5
- **フォーム**: React Hook Form 7 + Zod 4
- **UIコンポーネント**: Headless UI 2 + Radix UI

## 🚀 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集してAPIのURLなどを設定

# 開発サーバーの起動
npm run dev
```

開発サーバーが起動したら、ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### バックエンドの起動

フロントエンドと並行して、バックエンドAPIも起動する必要があります：

```bash
# プロジェクトルートで
docker-compose up
```

## 📁 プロジェクト構造

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # 認証必須ページ
│   │   ├── home/                 # ホームページ
│   │   ├── search/               # ユーザー検索
│   │   ├── matches/              # マッチ一覧
│   │   ├── chat/                 # チャット
│   │   ├── profile/              # プロフィール
│   │   └── safety/               # セーフティ管理
│   ├── auth/                     # 認証ページ
│   │   ├── login/                # ログイン
│   │   └── register/             # 新規登録
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # ルートページ
│   ├── error.tsx                 # エラーページ
│   ├── not-found.tsx             # 404ページ
│   └── loading.tsx               # ローディングページ
├── components/
│   ├── ui/                       # 基本UIコンポーネント
│   ├── features/                 # 機能別コンポーネント
│   │   ├── search/               # 検索機能
│   │   ├── chat/                 # チャット機能
│   │   └── safety/               # セーフティ機能
│   ├── layout/                   # レイアウトコンポーネント
│   ├── common/                   # 共通コンポーネント
│   └── providers/                # プロバイダー
├── lib/                          # ユーティリティ・設定
│   ├── api/                      # APIクライアント
│   ├── constants.ts              # 定数定義
│   ├── utils.ts                  # ユーティリティ関数
│   ├── seo.ts                    # SEOヘルパー
│   └── performance.ts            # パフォーマンス測定
├── hooks/                        # カスタムフック
├── stores/                       # Zustandストア
├── types/                        # TypeScript型定義
└── styles/                       # スタイル
```

## 📝 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Lint実行
npm run lint

# 型チェック
npm run type-check
```

## 📚 ドキュメント

詳細な実装ドキュメントは以下を参照してください：

- [検索・マッチング機能](./README_SEARCH.md)
- [チャット機能](./README_CHAT.md)
- [セーフティ機能](./README_SAFETY.md)
- [統合・最適化](./README_INTEGRATION.md)

## 🧪 テスト（将来実装）

```bash
# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e

# カバレッジ
npm run test:coverage
```

## 🔒 セキュリティ

- セキュリティヘッダー（CSP、X-Frame-Options等）設定済み
- XSS/CSRF対策実装済み
- 認証トークンの適切な管理
- 入力のバリデーション

## ♿ アクセシビリティ

- WCAG 2.1 AA準拠を目指す
- キーボードナビゲーション対応
- スクリーンリーダー対応
- ARIAラベル適用

## 📊 パフォーマンス

- React.memoによるコンポーネント最適化
- useCallbackによるコールバック最適化
- デバウンス処理による不要なAPI呼び出し削減
- React Queryによる効率的なキャッシュ管理

## 🌐 デプロイ

### Vercel（推奨）

```bash
# Vercelにデプロイ
vercel deploy

# 本番環境にデプロイ
vercel --prod
```

### その他のホスティング

Next.jsの標準的なビルド出力をサポートする任意のホスティングサービスで動作します。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは [MIT License](../LICENSE) の下で公開されています。

## 👥 開発チーム

Qupid開発チーム

## 📞 サポート

問題や質問がある場合は、GitHubのIssueを作成してください。

---

**作成日**: 2025年10月
**最終更新**: 2025年10月15日
