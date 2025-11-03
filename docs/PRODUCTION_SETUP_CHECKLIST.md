# 🚀 本番環境セットアップチェックリスト

## ⚠️ 重要：デプロイ前に確認すべき項目

本番環境でアプリケーションをデプロイする前に、以下の設定を確認してください。

---

## 1. ✅ CORS設定（必須）

### 問題
- フロントエンドからバックエンドへのリクエストがCORSエラーでブロックされる
- Preflightリクエスト（OPTIONS）が失敗する

### 解決方法

#### Render（バックエンド）の環境変数設定

1. Renderのダッシュボードで、バックエンドサービスの「Environment」セクションを開く

2. 以下の環境変数を追加：

```bash
# フロントエンドのURL（カンマ区切り）
CORS_ORIGINS=https://frontend-seven-psi-84.vercel.app,https://your-custom-domain.com

# 本番環境であることを明示
APP_ENV=production
```

3. **重要**: VercelのプレビューURL（`*.vercel.app`）は自動的に許可されるようになっています

4. 設定後、バックエンドサービスを再起動

---

## 2. 📧 メール送信設定（推奨）

### 問題
- アカウント新規登録時に認証コードが送信されない
- メール認証が動作しない

### 解決方法

#### Gmailを使用する場合（推奨：開発・小規模向け）

1. **Googleアカウントで2段階認証を有効化**
   - https://myaccount.google.com/security にアクセス
   - 「2段階認証プロセス」を有効化

2. **アプリパスワードを生成**
   - https://myaccount.google.com/apppasswords にアクセス
   - 「アプリを選択」→「メール」
   - 「デバイスを選択」→「その他（カスタム名）」→「Qupid」
   - 生成された16文字のパスワードをコピー（スペースは除去）

3. **Renderの環境変数を設定**

```bash
# メール送信を有効化（必須）
ENABLE_EMAIL=true

# SMTP設定
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password  # スペースなしで入力
FROM_EMAIL=your-email@gmail.com

# メール送信のリトライ設定
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=2
```

#### SendGridを使用する場合（推奨：中〜大規模向け）

1. **SendGridアカウントを作成**
   - https://sendgrid.com/ でサインアップ
   - 無料プランを選択

2. **APIキーを作成**
   - Settings → API Keys
   - 「Create API Key」をクリック
   - 名前を「Qupid」に設定
   - 「Full Access」を選択
   - APIキーをコピー

3. **Renderの環境変数を設定**

```bash
ENABLE_EMAIL=true
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

### メール送信のテスト

設定後、以下のコマンドでメール送信をテストできます：

```bash
python dev_tools/test_email_service.py --email test@s.kyushu-u.ac.jp
```

詳細は [メール認証システムセットアップガイド](EMAIL_PRODUCTION_SETUP.md) を参照してください。

---

## 3. 🔐 セキュリティ設定（必須）

### Renderの環境変数設定

```bash
# セキュリティキー（必須）
SECRET_KEY=your-generated-secret-key
# 生成方法: python -c "import secrets; print(secrets.token_urlsafe(32))"

# アプリケーション設定
APP_NAME=Qupid API
APP_ENV=production

# データベース設定
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/qupid

# トークンの有効期限
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7日間

# 許可するメールドメイン
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp
```

---

## 4. 📊 エラー監視（推奨）

### Sentry設定（エラー監視）

```bash
# Sentry設定（エラー監視）
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

Sentryアカウント作成: https://sentry.io/

---

## 5. 🔍 確認手順

デプロイ後、以下の手順で動作確認してください：

### 1. バックエンドのヘルスチェック

```bash
curl https://qupid-api.onrender.com/health
```

### 2. CORS設定の確認

ブラウザの開発者ツールで、フロントエンドからAPIリクエストを送信し、CORSエラーが発生しないことを確認

### 3. メール送信の確認

1. フロントエンドから新規登録を試みる
2. メールボックスに認証コードが届くことを確認
3. 認証コードを使って登録を完了

---

## 🐛 トラブルシューティング

### 問題1: CORSエラーが発生する

**症状**: ブラウザコンソールに "CORS policy" エラー

**解決方法**:
1. Renderの環境変数に `CORS_ORIGINS` が設定されているか確認
2. フロントエンドのURLが正確に入力されているか確認（スペースなし、カンマ区切り）
3. バックエンドサービスを再起動

### 問題2: メールが送信されない

**症状**: 認証コードが届かない

**解決方法**:
1. `ENABLE_EMAIL=true` が設定されているか確認
2. `SMTP_USERNAME` と `SMTP_PASSWORD` が正しく設定されているか確認
3. Gmailを使用している場合、アプリパスワードにスペースが含まれていないか確認
4. Renderのログを確認（`SMTP Authentication Error` など）

### 問題3: プレビューURLでエラーが発生する

**症状**: VercelのプレビューURL（`frontend-xxx-xxx.vercel.app`）でCORSエラー

**解決方法**:
- コードは既に `*.vercel.app` を自動許可するように設定されています
- バックエンドサービスを再起動して変更を反映

---

## 📝 環境変数の完全なリスト

Renderの環境変数に以下を設定してください：

```bash
# ========================
# アプリケーション設定
# ========================
APP_NAME=Qupid API
APP_ENV=production

# ========================
# データベース設定
# ========================
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/qupid

# ========================
# セキュリティ設定（必須）
# ========================
SECRET_KEY=your-generated-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp

# ========================
# CORS設定（必須）
# ========================
CORS_ORIGINS=https://frontend-seven-psi-84.vercel.app,https://your-custom-domain.com

# ========================
# メール送信設定（推奨）
# ========================
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=2

# ========================
# Sentry設定（エラー監視 - 推奨）
# ========================
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## ✅ チェックリスト

デプロイ前に以下を確認してください：

- [ ] `APP_ENV=production` が設定されている
- [ ] `SECRET_KEY` が生成され、設定されている
- [ ] `DATABASE_URL` が正しく設定されている（`postgresql+asyncpg://`）
- [ ] `CORS_ORIGINS` にフロントエンドのURLが設定されている
- [ ] `ENABLE_EMAIL=true` が設定されている（メール認証を使用する場合）
- [ ] `SMTP_USERNAME` と `SMTP_PASSWORD` が正しく設定されている
- [ ] バックエンドサービスが正常に起動している
- [ ] フロントエンドからAPIリクエストが成功する（CORSエラーなし）
- [ ] メール送信が正常に動作する（認証コードが届く）

---

## 📚 関連ドキュメント

- [メール認証システムセットアップガイド](EMAIL_PRODUCTION_SETUP.md)
- [Renderデプロイメントガイド](RENDER_DEPLOYMENT_GUIDE.md)
- [本番環境セットアップガイド](PRODUCTION_SETUP.md)

