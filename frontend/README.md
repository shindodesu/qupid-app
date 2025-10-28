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
- 📱 **PWA対応**: ネイティブアプリのようにホーム画面に追加可能

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

# 環境変数の設定（開発環境）
# .env.local ファイルを作成して以下を追加：
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NODE_ENV=development

# 開発サーバーの起動
npm run dev
```

開発サーバーが起動したら、ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 環境変数

フロントエンドでは以下の環境変数を使用します：

| 変数名 | 説明 | 開発環境 | 本番環境 |
|--------|------|----------|----------|
| `NEXT_PUBLIC_API_URL` | バックエンドAPIのURL | `http://localhost:8000` | `https://qupid-api.onrender.com` |
| `NODE_ENV` | 実行環境 | `development` | `production` |

**開発環境と本番環境の違い:**
- **開発環境** (`NODE_ENV=development`): メール認証コードがブラウザコンソールとバックエンドターミナルに表示されます
- **本番環境** (`NODE_ENV=production`): 実際のメールが送信されます（`ENABLE_EMAIL=true`の場合）

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

- [検索・マッチング機能](../docs/implementation-plans/debug/README_SEARCH.md)
- [チャット機能](../docs/implementation-plans/debug/README_CHAT.md)
- [セーフティ機能](../docs/implementation-plans/debug/README_SAFETY.md)
- [統合・最適化](../docs/implementation-plans/debug/README_INTEGRATION.md)

## 🧪 テスト（✅実装済み）

```bash
# 単体テスト
npm test

# ウォッチモード
npm run test:watch

# カバレッジ
npm run test:coverage
```

**実装済みテスト**:
- `src/components/ui/__tests__/Button.test.tsx` - 7テスト
- `src/components/ui/__tests__/Input.test.tsx` - 8テスト
- `src/components/ui/__tests__/Skeleton.test.tsx` - 8テスト
- `src/components/auth/__tests__/LoginForm.test.tsx` - 5テスト

**合計**: 28テスト

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

## 📱 PWA（Progressive Web App）として使用する

Qupidはネイティブアプリのようにスマートフォンやタブレットのホーム画面に追加できます。

### iOSデバイス（iPhone/iPad）での追加方法

1. **Safariでアプリを開く**
   - https://qupid.vercel.app にアクセス

2. **共有ボタンをタップ**
   - 画面下部の「共有」ボタン（□に↑のアイコン）をタップ

3. **ホーム画面に追加**
   - メニューから「ホーム画面に追加」を選択
   - アプリ名を確認し、「追加」をタップ

4. **ホーム画面からアプリを起動**
   - ホーム画面に追加されたQupidアイコンをタップ
   - フルスクリーンで起動します

### Androidデバイスでの追加方法

1. **Chrome/Edgeでアプリを開く**
   - https://qupid.vercel.app にアクセス

2. **メニューを開く**
   - 右上の「︙」（3点アイコン）をタップ

3. **ホーム画面に追加**
   - 「ホーム画面に追加」または「アプリをインストール」を選択
   - 「インストール」をタップ

4. **ホーム画面からアプリを起動**
   - ホーム画面に追加されたQupidアイコンをタップ

### PWAの機能

- ✅ **オフライン対応**: 一度訪れたページはオフラインでも閲覧可能
- ✅ **高速起動**: キャッシュにより素早く起動
- ✅ **フルスクリーン**: ブラウザのUIなしで表示
- ✅ **ショートカット**: アプリから直接「探す」「マッチ」「チャット」にアクセス可能
- ✅ **プッシュ通知**: （今後実装予定）

### 注意事項

- **iOS**: Safariでのみホーム画面への追加が可能です（Chrome/Firefoxは非対応）
- **Android**: Chrome、Edge、Samsungブラウザなどで対応

## 📄 ライセンス

このプロジェクトは [MIT License](../LICENSE) の下で公開されています。

## 👥 開発チーム

Qupid開発チーム

## 📞 サポート

問題や質問がある場合は、GitHubのIssueを作成してください。

---

**作成日**: 2025年10月
**最終更新**: 2025年10月15日
