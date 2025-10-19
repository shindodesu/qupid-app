# Qupid デプロイメントガイド

## 📋 概要

このガイドでは、Qupidアプリケーション（フロントエンド + バックエンド）をテスト環境にデプロイする手順を説明します。

## 🎯 デプロイ構成

### フロントエンド
- **ホスティング**: Vercel
- **フレームワーク**: Next.js 15
- **URL**: https://qupid.vercel.app（予定）

### バックエンド
- **ホスティング**: Render
- **フレームワーク**: FastAPI + PostgreSQL
- **URL**: https://qupid-api.onrender.com（予定）

## 🚀 バックエンドのデプロイ（Render）

### 1. Renderアカウント作成
1. [Render](https://render.com/) にアクセス
2. GitHubアカウントでサインアップ

### 2. PostgreSQLデータベース作成
1. Renderダッシュボードで「New +」→「PostgreSQL」を選択
2. 以下の設定で作成：
   - **Name**: qupid-db
   - **Database**: mydatabase
   - **User**: user
   - **Region**: Singapore（最も近いリージョン）
   - **Plan**: Free
3. 作成後、**Internal Database URL**をコピー（後で使用）

### 3. Web Service（API）作成
1. Renderダッシュボードで「New +」→「Web Service」を選択
2. GitHubリポジトリを接続
3. 以下の設定：
   - **Name**: qupid-api
   - **Region**: Singapore
   - **Branch**: main（または現在のブランチ）
   - **Root Directory**: （空白のまま）
   - **Runtime**: Docker
   - **Plan**: Free

### 4. 環境変数の設定
Renderの Environment タブで以下を設定：

```bash
DATABASE_URL=postgresql+asyncpg://user:password@hostname:5432/mydatabase
# ↑ PostgreSQLの Internal Database URL を asyncpg形式に変換
# 例: postgresql://user:pass@host:5432/db
#   → postgresql+asyncpg://user:pass@host:5432/db

SECRET_KEY=your-super-secret-key-change-this
APP_ENV=production
ALLOWED_ORIGINS=https://qupid.vercel.app,http://localhost:3000

# メール送信設定（オプション: 本番環境でメール送信を有効にする場合）
ENABLE_EMAIL=true  # メール送信を有効化
SMTP_SERVER=smtp.gmail.com  # SMTPサーバー
SMTP_PORT=587  # SMTPポート
SMTP_USERNAME=your-email@gmail.com  # 送信元メールアドレス
SMTP_PASSWORD=your-app-password  # アプリパスワード
FROM_EMAIL=noreply@qupid.com  # 送信元として表示されるメールアドレス
```

**注意**: 
- 開発環境では `ENABLE_EMAIL=false` のままにしておくと、認証コードがコンソールに出力されます
- 本番環境でメール送信を有効にする場合は、Gmail等のSMTPサービスのアプリパスワードを取得してください
- Gmailの場合: [Googleアカウント](https://myaccount.google.com/) → セキュリティ → 2段階認証プロセス → アプリパスワード

### 5. デプロイ
- 「Manual Deploy」→「Deploy latest commit」をクリック
- ビルドとデプロイが完了するまで待機（5-10分）
- デプロイURLをコピー（例: https://qupid-api.onrender.com）

## 🌐 フロントエンドのデプロイ（Vercel）

### 1. Vercelアカウント作成
1. [Vercel](https://vercel.com/) にアクセス
2. GitHubアカウントでサインアップ

### 2. プロジェクトのインポート
1. Vercelダッシュボードで「Add New...」→「Project」を選択
2. GitHubリポジトリを接続
3. 以下の設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: frontend
   - **Build Command**: npm run build
   - **Output Directory**: .next
   - **Install Command**: npm install

### 3. 環境変数の設定
Environment Variables タブで以下を設定：

```bash
NEXT_PUBLIC_API_URL=https://qupid-api.onrender.com
# ↑ RenderでデプロイしたバックエンドのURL

NODE_ENV=production
# 本番環境に設定すると、開発環境向けのメッセージが非表示になります
```

**重要**: 
- `NODE_ENV=production` に設定すると、メール認証時に「開発環境ではコンソールで確認してください」というメッセージが表示されなくなります
- 開発環境（localhost）では自動的に開発モードとして動作します

### 4. デプロイ
- 「Deploy」ボタンをクリック
- ビルドとデプロイが完了するまで待機（2-5分）
- デプロイURL（例: https://qupid.vercel.app）が発行される

## 🔧 デプロイ後の設定

### バックエンドのCORS設定確認

`app/core/config.py` を確認：

```python
class Settings(BaseSettings):
    # ...
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://qupid.vercel.app"
```

Vercelの本番URLを追加してください。

### データベースマイグレーション

Renderのシェルで実行：

```bash
# Renderの Web Service のシェルを開く
alembic upgrade head
```

または、`render.yaml` に以下を追加（自動実行）：

```yaml
services:
  - type: web
    name: qupid-api
    runtime: docker
    buildCommand: alembic upgrade head
```

## 📝 クイックデプロイ手順（5ステップ）

### ステップ1: バックエンドDB作成（Render）
```
Render → New PostgreSQL → 作成完了
→ Internal Database URL をコピー
```

### ステップ2: バックエンドAPI作成（Render）
```
Render → New Web Service → GitHubリポジトリ接続
→ 環境変数設定（DATABASE_URL等）
→ デプロイ → URL取得
```

### ステップ3: フロントエンド作成（Vercel）
```
Vercel → New Project → GitHubリポジトリ接続
→ Root Directory: frontend
→ 環境変数設定（NEXT_PUBLIC_API_URL）
→ デプロイ → URL取得
```

### ステップ4: CORS設定
```
バックエンドにVercelのURLを追加
→ git push → 自動再デプロイ
```

### ステップ5: 動作確認
```
VercelのURL にアクセス
→ 登録・ログイン → 機能テスト
```

## 🔒 セキュリティチェックリスト

デプロイ前に確認：

- [ ] 環境変数でシークレット情報を管理
- [ ] CORS設定の確認
- [ ] HTTPS強制（Render、Vercelは自動）
- [ ] データベースのバックアップ設定
- [ ] APIレート制限の設定（将来）
- [ ] モニタリング設定（Sentry等）

## 🧪 デプロイ後のテスト

1. **認証テスト**
   - ユーザー登録
   - ログイン
   - ログアウト

2. **機能テスト**
   - プロフィール編集
   - ユーザー検索
   - いいね送信
   - マッチング
   - チャット

3. **パフォーマンステスト**
   - ページ読み込み速度
   - API応答速度

## 🐛 トラブルシューティング

### フロントエンドがバックエンドに接続できない
- 環境変数 `NEXT_PUBLIC_API_URL` が正しいか確認
- バックエンドのCORS設定を確認
- ブラウザのコンソールでエラーを確認

### バックエンドがデータベースに接続できない
- `DATABASE_URL` が正しいか確認
- PostgreSQLが起動しているか確認
- マイグレーションが実行されているか確認

### ビルドエラー
- 依存関係が正しくインストールされているか確認
- Node.jsのバージョンを確認（18以上）
- ビルドログでエラー詳細を確認

## 💰 コスト

### 無料プラン（テスト用）
- **Vercel**: Free（個人プロジェクト）
  - 帯域幅: 100GB/月
  - ビルド: 6000分/月
  
- **Render**: Free
  - Web Service: スリープあり（15分無通信で停止）
  - PostgreSQL: 90日後に削除、256MB RAM

### 有料プラン（本番用）
- **Vercel Pro**: $20/月
  - 帯域幅: 1TB/月
  - スリープなし

- **Render Starter**: $7/月（DB）+ $7/月（Web Service）
  - スリープなし
  - より多いリソース

## 📈 監視とメンテナンス

### ログ確認
- **Render**: ダッシュボード → Logs
- **Vercel**: ダッシュボード → Function Logs

### エラー監視
- Sentry統合（推奨）
- エラー発生時にメール通知

### パフォーマンス監視
- Vercel Analytics（無料）
- Render Metrics

## 🔄 CI/CD（将来）

GitHubへのpush時に自動デプロイ：

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
```

## 📞 サポート

質問や問題がある場合：
- RenderのDiscordコミュニティ
- VercelのDiscordコミュニティ
- GitHubのIssue

---

**作成日**: 2025年10月15日
**担当**: Qupid開発チーム

