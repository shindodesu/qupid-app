# 🔍 Render環境変数チェックリスト

## 📋 必須環境変数

### 1. アプリケーション基本設定

- [ ] **APP_NAME**
  - 値: `Qupid API`
  - 説明: アプリケーション名

- [ ] **APP_ENV**
  - 値: `production`
  - 説明: 環境モード（本番環境では必ず `production`）

- [ ] **PYTHON_VERSION**
  - 値: `3.11.0`
  - 説明: Pythonのバージョン

---

### 2. セキュリティ設定（必須）

- [ ] **SECRET_KEY**
  - 生成方法: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
  - 説明: JWTトークンの署名に使用される秘密鍵
  - ⚠️ **重要**: 本番環境では必ず設定が必要。未設定の場合、アプリケーションが起動しません。

- [ ] **ACCESS_TOKEN_EXPIRE_MINUTES**
  - 値: `10080` (7日間)
  - 説明: アクセストークンの有効期限（分）

- [ ] **ALLOWED_EMAIL_DOMAIN**
  - 値: `s.kyushu-u.ac.jp`
  - 説明: 許可するメールドメイン

---

### 3. データベース設定（必須）

- [ ] **DATABASE_URL**
  - 形式: `postgresql+asyncpg://user:password@host:5432/qupid`
  - 説明: PostgreSQLデータベースの接続URL
  - ⚠️ **重要**: Renderのデータベースサービスを使用している場合、自動的に設定されます。
  - 確認方法: Renderダッシュボード → Database → Internal Database URL

---

### 4. CORS設定（画像読み込みに重要）

- [ ] **CORS_ORIGINS**
  - 値: `https://qupid-app.vercel.app`
  - 説明: フロントエンドのURL（カンマ区切りで複数指定可能）
  - ⚠️ **重要**: 画像の404エラーに関連する可能性があります。
  - 確認方法: Renderダッシュボード → Environment → `CORS_ORIGINS`
  - 複数のフロントエンドURLがある場合: `https://qupid-app.vercel.app,https://qupid-app-preview.vercel.app`

---

### 5. メール送信設定

- [ ] **ENABLE_EMAIL**
  - 値: `true`
  - 説明: メール送信を有効化

- [ ] **SMTP_SERVER**
  - 値: `smtp.gmail.com`
  - 説明: SMTPサーバーのアドレス

- [ ] **SMTP_PORT**
  - 値: `587`
  - 説明: SMTPサーバーのポート番号

- [ ] **SMTP_USERNAME**
  - 値: `qudai.qupid@gmail.com`
  - 説明: SMTP認証用のユーザー名

- [ ] **SMTP_PASSWORD** ⚠️ **手動設定が必要**
  - 値: Gmailのアプリパスワード
  - 説明: SMTP認証用のパスワード
  - ⚠️ **重要**: `render.yaml`では `sync: false` となっているため、Renderダッシュボードで手動設定が必要です。
  - 設定方法:
    1. Renderダッシュボード → Environment → Add Environment Variable
    2. Key: `SMTP_PASSWORD`
    3. Value: Gmailのアプリパスワード（16文字）
    4. Save

- [ ] **FROM_EMAIL**
  - 値: `qudai.qupid@gmail.com`
  - 説明: 送信元メールアドレス

- [ ] **EMAIL_MAX_RETRIES**
  - 値: `3`
  - 説明: メール送信の最大リトライ回数

- [ ] **EMAIL_RETRY_DELAY**
  - 値: `2`
  - 説明: リトライ間の待機時間（秒）

- [ ] **EMAIL_RATE_LIMIT_PER_HOUR**
  - 値: `10`
  - 説明: 1時間あたりの最大メール送信数

---

### 6. レート制限設定

- [ ] **API_RATE_LIMIT_PER_MINUTE**
  - 値: `100`
  - 説明: 1分あたりの最大APIリクエスト数

---

### 7. エラー監視（推奨）

- [ ] **SENTRY_DSN**（オプション）
  - 値: `https://your-sentry-dsn@sentry.io/project-id`
  - 説明: SentryのDSN（エラー監視用）
  - 設定方法: https://sentry.io/ でアカウント作成 → プロジェクト作成 → DSNを取得

---

## 🔍 画像読み込み404エラーに関連する確認事項

### 1. CORS設定の確認

**問題**: 画像URLがフロントエンドのVercelドメインを指している場合、CORS設定が原因の可能性があります。

**確認方法**:
1. Renderダッシュボード → Environment → `CORS_ORIGINS` を確認
2. 値が `https://qupid-app.vercel.app` になっているか確認
3. 複数のフロントエンドURLがある場合、カンマ区切りで追加

**修正方法**:
```bash
# Renderダッシュボードで設定
CORS_ORIGINS=https://qupid-app.vercel.app,https://qupid-app-preview.vercel.app
```

### 2. 静的ファイル配信の確認

**問題**: `/uploads` ディレクトリが正しくマウントされているか確認が必要です。

**確認方法**:
- `app/main.py` で以下の設定が存在することを確認:
  ```python
  app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
  ```

**注意**: Renderの無料プランでは、ファイルシステムが一時的です。永続的なファイル保存には、外部ストレージ（S3、Cloudinaryなど）の使用を推奨します。

---

## 📝 Renderダッシュボードでの確認手順

1. **Renderダッシュボードにログイン**
   - https://dashboard.render.com/

2. **プロジェクトを選択**
   - `qupid-api` を選択

3. **Environment タブを開く**
   - 左側のメニューから「Environment」を選択

4. **各環境変数を確認**
   - 上記のチェックリストに従って、各環境変数が設定されているか確認

5. **手動設定が必要な環境変数を追加**
   - `SMTP_PASSWORD` など、`sync: false` となっている環境変数は手動で設定が必要

6. **変更後は再デプロイ**
   - 環境変数を変更した後は、必ず再デプロイを実行

---

## ⚠️ よくある問題と解決方法

### 問題1: 画像が読み込めない（404エラー）

**原因**:
- `CORS_ORIGINS` が正しく設定されていない
- フロントエンドのURLが `CORS_ORIGINS` に含まれていない

**解決方法**:
1. Renderダッシュボードで `CORS_ORIGINS` を確認
2. フロントエンドのURL（`https://qupid-app.vercel.app`）が含まれているか確認
3. 含まれていない場合は追加して再デプロイ

### 問題2: メールが送信されない

**原因**:
- `SMTP_PASSWORD` が設定されていない
- Gmailのアプリパスワードが正しくない

**解決方法**:
1. Gmailでアプリパスワードを生成
2. Renderダッシュボードで `SMTP_PASSWORD` を設定
3. 再デプロイ

### 問題3: アプリケーションが起動しない

**原因**:
- `SECRET_KEY` が設定されていない（本番環境では必須）

**解決方法**:
1. `SECRET_KEY` を生成: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
2. Renderダッシュボードで `SECRET_KEY` を設定
3. 再デプロイ

---

## 🔗 関連ドキュメント

- [本番環境セットアップガイド](PRODUCTION_SETUP.md)
- [Vercelセットアップガイド](../VERCEL_SETUP.md)
- [Renderデプロイメントガイド](RENDER_DEPLOYMENT_GUIDE.md)




