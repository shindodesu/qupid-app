# 🚀 本番環境セットアップガイド

## 📋 概要

このドキュメントでは、Qupidアプリケーションを本番環境にデプロイするための手順を説明します。

---

## 🔧 バックエンド設定

### 1. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```bash
# アプリケーション設定
APP_NAME="Qupid API"
APP_ENV=production  # 必ず production に設定

# データベース設定
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/qupid
# または本番用データベースURL（Render, Supabase, etc.）

# セキュリティ設定（必須）
SECRET_KEY=your-generated-secret-key
# 生成方法: python -c "import secrets; print(secrets.token_urlsafe(32))"

ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7日間

# メールドメイン制限
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp

# メール送信設定（本番環境では有効化推奨）
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@qupid.com

# Sentry設定（エラー監視 - 強く推奨）
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# Sentryアカウント作成: https://sentry.io/

# CORS設定（フロントエンドのURLを追加）
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. 依存関係のインストール

```bash
cd /path/to/Qupid
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. データベースマイグレーション

```bash
# マイグレーションを実行
alembic upgrade head

# 確認
alembic current
```

### 4. テストの実行

```bash
# すべてのテストを実行
pytest tests/ -v

# カバレッジ付き
pytest tests/ --cov=app --cov-report=term-missing
```

### 5. アプリケーションの起動

**開発サーバー:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**本番サーバー（Gunicorn + Uvicorn）:**
```bash
# Gunicornをインストール（requirements.txtに追加済み）
pip install gunicorn

# 起動（4ワーカー）
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

---

## 🎨 フロントエンド設定

### 1. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# API エンドポイント（本番環境URL）
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# アプリケーション環境
NEXT_PUBLIC_APP_ENV=production

# Sentry DSN（エラー監視 - 強く推奨）
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# WebSocket URL
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws

# 認証設定
NEXT_PUBLIC_TOKEN_EXPIRY=604800000  # 7日間（ミリ秒）
```

### 2. 依存関係のインストール

```bash
cd /path/to/Qupid/frontend
npm install
```

### 3. ビルド

```bash
# 本番用ビルド
npm run build

# ビルドの確認
npm start
```

### 4. テストの実行

```bash
# すべてのテストを実行
npm test

# カバレッジ付き
npm run test:coverage

# ウォッチモード（開発中）
npm run test:watch
```

---

## 🔒 セキュリティチェックリスト

### バックエンド

- [ ] `SECRET_KEY` を本番用に生成・設定済み
- [ ] `APP_ENV=production` に設定済み
- [ ] データベースURLが本番環境のものに設定済み
- [ ] CORS設定が正しいドメインのみ許可している
- [ ] Sentry DSNが設定済み（エラー監視）
- [ ] SMTP設定が正しく動作する（メール送信テスト済み）
- [ ] データベースバックアップが自動化されている
- [ ] HTTPS/TLSが有効化されている

### フロントエンド

- [ ] `NEXT_PUBLIC_API_URL` が本番APIのURLに設定済み
- [ ] `NEXT_PUBLIC_APP_ENV=production` に設定済み
- [ ] Sentry DSNが設定済み（エラー監視）
- [ ] ソースマップが本番環境にアップロードされている
- [ ] CSPヘッダーが適切に設定されている
- [ ] 不要なコンソールログが削除されている
- [ ] 環境変数に機密情報が含まれていない

---

## 📊 監視とログ

### Sentry統合

1. **Sentryアカウント作成**
   - https://sentry.io/ でアカウントを作成
   - 新しいプロジェクトを作成（FastAPI用とNext.js用で2つ）

2. **DSNの取得**
   - プロジェクト設定 → Client Keys (DSN)
   - DSNをコピーして環境変数に設定

3. **確認**
   - テストエラーを発生させて、Sentryダッシュボードに表示されることを確認

### ログ設定

バックエンドのログは以下のように設定されています：

```python
# app/core/logging_config.py を作成推奨
import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('app.log')
        ]
    )
```

---

## 🚀 デプロイ手順

### Render.com へのデプロイ（バックエンド）

1. **新しいWeb Serviceを作成**
   - Repository を接続
   - Build Command: `pip install -r requirements.txt && alembic upgrade head`
   - Start Command: `gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

2. **環境変数を設定**
   - すべての環境変数をRenderのダッシュボードで設定

3. **データベースを接続**
   - PostgreSQLサービスを作成
   - `DATABASE_URL` を設定

### Vercel へのデプロイ（フロントエンド）

1. **新しいプロジェクトを作成**
   - Repository を接続
   - Framework Preset: Next.js
   - Root Directory: `frontend`

2. **環境変数を設定**
   - すべての環境変数をVercelのダッシュボードで設定

3. **デプロイ**
   - 自動的にビルド・デプロイが開始

---

## 🔍 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー

**症状**: `OperationalError: could not connect to server`

**解決方法**:
- `DATABASE_URL` が正しいか確認
- データベースが起動しているか確認
- ファイアウォール設定を確認

#### 2. CORS エラー

**症状**: ブラウザコンソールに `CORS policy` エラー

**解決方法**:
- バックエンドの `CORS_ORIGINS` にフロントエンドのURLを追加
- フロントエンドの `NEXT_PUBLIC_API_URL` が正しいか確認

#### 3. WebSocket接続エラー

**症状**: WebSocketが接続できない

**解決方法**:
- `NEXT_PUBLIC_WS_URL` が正しいか確認（`wss://` プロトコル）
- バックエンドがWebSocketをサポートしているか確認
- プロキシ/ロードバランサーがWebSocketをサポートしているか確認

#### 4. Sentry エラーが送信されない

**症状**: Sentryダッシュボードにエラーが表示されない

**解決方法**:
- `SENTRY_DSN` が正しいか確認
- `APP_ENV=production` に設定されているか確認
- テストエラーを発生させて確認

---

## 📈 パフォーマンスチェック

### Lighthouse スコア

フロントエンドのパフォーマンスを測定：

```bash
# Lighthouse CLI をインストール
npm install -g lighthouse

# スコアを測定
lighthouse https://yourdomain.com --view
```

**目標スコア:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### バックエンドパフォーマンス

```bash
# Apache Benchで負荷テスト
ab -n 1000 -c 10 https://api.yourdomain.com/health

# または wrk
wrk -t12 -c400 -d30s https://api.yourdomain.com/health
```

---

## 📚 参考資料

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)
- [PostgreSQL on Render](https://render.com/docs/databases)

---

## 🆘 サポート

問題が発生した場合:

1. Sentryダッシュボードでエラーログを確認
2. アプリケーションログを確認
3. データベース接続を確認
4. 環境変数が正しく設定されているか確認

---

## ✅ デプロイ後のチェックリスト

- [ ] アプリケーションが正常に起動している
- [ ] データベースマイグレーションが完了している
- [ ] すべてのAPIエンドポイントが動作している
- [ ] WebSocket接続が正常に動作している
- [ ] メール送信が正常に動作している（有効化している場合）
- [ ] Sentryでエラー監視が動作している
- [ ] HTTPS/TLSが有効化されている
- [ ] パフォーマンステストをパスしている
- [ ] セキュリティスキャンをパスしている
- [ ] ドメイン名が正しく設定されている
- [ ] バックアップが自動化されている

---

**本番環境へのデプロイ、おめでとうございます！🎉**





