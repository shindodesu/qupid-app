# 🚀 Render.com デプロイガイド

Qupidアプリケーションを**Render.com**にデプロイする手順

---

## 📋 前提条件

- ✅ GitHubアカウント
- ✅ Render.comアカウント（https://render.com/ で無料登録）
- ✅ Gmailアプリパスワード（取得方法は `docs/EMAIL_QUICK_START.md` 参照）

---

## 🎯 ステップ1: PostgreSQLデータベースの作成

### 1.1 Renderダッシュボードにログイン

https://dashboard.render.com/

### 1.2 新しいPostgreSQLデータベースを作成

1. **「New +」ボタン** → **「PostgreSQL」**を選択
2. 以下の情報を入力：
   - **Name**: `qupid-db`
   - **Database**: `qupid`
   - **User**: `qupid_user`（自動生成でもOK）
   - **Region**: 最寄りのリージョン（例: Oregon, USA）
   - **Plan**: **Free** を選択
3. **「Create Database」**をクリック

### 1.3 接続情報をコピー

データベースが作成されたら、以下の情報をコピー：
- **Internal Database URL** をメモ（後で使用）

---

## 🎯 ステップ2: バックエンドのデプロイ

### 2.1 新しいWeb Serviceを作成

1. **「New +」ボタン** → **「Web Service」**を選択
2. **GitHubリポジトリを接続**
   - 「Connect a repository」をクリック
   - Qupidリポジトリを選択
3. 以下の情報を入力：
   - **Name**: `qupid-api`
   - **Region**: データベースと同じリージョン
   - **Branch**: `main`（または `master`）
   - **Root Directory**: （空欄のまま）
   - **Environment**: **Python 3**
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && alembic upgrade head
     ```
   - **Start Command**:
     ```bash
     gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
     ```
   - **Plan**: **Free** を選択

### 2.2 環境変数を設定

「Environment」タブに移動して、以下の環境変数を追加：

```bash
# アプリケーション設定
APP_NAME=Qupid API
APP_ENV=production

# データベース（Internal Database URLをコピー）
DATABASE_URL=postgresql+asyncpg://qupid_user:password@dpg-xxx.oregon-postgres.render.com/qupid

# セキュリティ（必ず新しく生成！）
SECRET_KEY=（python -c "import secrets; print(secrets.token_urlsafe(32))"で生成）
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp

# メール送信設定
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=qudai.qupid@gmail.com
SMTP_PASSWORD=（Gmailアプリパスワード16文字）
FROM_EMAIL=qudai.qupid@gmail.com

# リトライ・レート制限設定
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=2
EMAIL_RATE_LIMIT_PER_HOUR=10
API_RATE_LIMIT_PER_MINUTE=100

# エラー監視（オプション）
# SENTRY_DSN=your-sentry-dsn
```

💡 **重要:** 
- `DATABASE_URL`はステップ1.3でコピーしたものを使用
- `postgresql://`を`postgresql+asyncpg://`に変更してください
- `SECRET_KEY`は必ず新しく生成してください

### 2.3 デプロイ

**「Create Web Service」**をクリックすると、自動的にデプロイが開始されます。

デプロイには5〜10分かかります。ログを確認してエラーがないか確認してください。

---

## 🎯 ステップ3: デプロイの確認

### 3.1 APIエンドポイントを確認

デプロイが完了したら、Renderが提供するURLにアクセス：

```
https://qupid-api.onrender.com
```

### 3.2 ヘルスチェック

```bash
# ブラウザまたはcurlで確認
curl https://qupid-api.onrender.com/health
```

期待される応答：
```json
{
  "status": "healthy",
  "app_name": "Qupid API",
  "environment": "production"
}
```

### 3.3 API ドキュメントを確認

```
https://qupid-api.onrender.com/docs
```

Swagger UIが表示されれば成功！

---

## 🎯 ステップ4: メール送信のテスト

### 4.1 認証コードを送信

```bash
curl -X POST "https://qupid-api.onrender.com/auth/email/send-code" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test@s.kyushu-u.ac.jp"}'
```

### 4.2 メールを確認

- 受信トレイに認証コードが届くことを確認
- スパムフォルダも確認

---

## 🎯 ステップ5: フロントエンドのデプロイ（Vercel）

### 5.1 Vercelにログイン

https://vercel.com/

### 5.2 新しいプロジェクトを作成

1. **「Add New...」** → **「Project」**
2. GitHubリポジトリをインポート
3. 以下の設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 5.3 環境変数を設定

```bash
# API エンドポイント
NEXT_PUBLIC_API_URL=https://qupid-api.onrender.com

# アプリケーション環境
NEXT_PUBLIC_APP_ENV=production

# WebSocket URL
NEXT_PUBLIC_WS_URL=wss://qupid-api.onrender.com/ws

# 認証設定
NEXT_PUBLIC_TOKEN_EXPIRY=604800000

# Sentry（オプション）
# NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 5.4 デプロイ

**「Deploy」**をクリックしてデプロイを開始。

完了すると、VercelがURLを提供します：
```
https://qupid.vercel.app
```

---

## ✅ デプロイ完了チェックリスト

### バックエンド
- [ ] データベースが作成された
- [ ] Web Serviceが正常にデプロイされた
- [ ] `/health`エンドポイントが応答する
- [ ] `/docs`でAPI ドキュメントが表示される
- [ ] 環境変数が正しく設定されている
- [ ] メール送信テストが成功する

### フロントエンド
- [ ] Vercelプロジェクトが作成された
- [ ] ビルドが成功した
- [ ] アプリケーションが表示される
- [ ] APIと正常に通信できる
- [ ] ログイン/登録が機能する

### セキュリティ
- [ ] `APP_ENV=production`
- [ ] 本番用の`SECRET_KEY`を使用
- [ ] HTTPSが有効（Renderが自動設定）
- [ ] 環境変数に機密情報が含まれていない（Gitにコミットされていない）

---

## 🔧 トラブルシューティング

### 問題1: ビルドが失敗する

**症状**: "Build failed"

**原因**:
- `requirements.txt`に問題がある
- Python バージョンが合わない

**解決方法**:
```bash
# runtime.txt を作成
echo "python-3.11.0" > runtime.txt
git add runtime.txt
git commit -m "Add Python version"
git push
```

### 問題2: データベースに接続できない

**症状**: "OperationalError: could not connect to server"

**原因**:
- `DATABASE_URL`が正しくない
- `postgresql://`のままになっている

**解決方法**:
```bash
# DATABASE_URLを確認
# postgresql:// → postgresql+asyncpg:// に変更
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
```

### 問題3: メールが送信されない

**症状**: "SMTP Authentication Error"

**原因**:
- Gmailアプリパスワードが間違っている
- スペースが含まれている

**解決方法**:
1. アプリパスワードを再生成
2. スペースを除去して再設定
3. Renderの環境変数を更新

### 問題4: CORSエラー

**症状**: ブラウザコンソールに "CORS policy" エラー

**原因**:
- フロントエンドのURLが許可されていない

**解決方法**:
```python
# app/main.py に追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://qupid.vercel.app"  # ← フロントエンドのURLを追加
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 Renderの制限（無料プラン）

### データベース
- ストレージ: 1GB
- 接続数: 97
- 保持期間: 90日（アクティブな場合）

### Web Service
- メモリ: 512MB
- CPU: 共有
- スリープ: 15分間アクティビティがないとスリープ（最初のリクエストで起動、30秒〜1分かかる）

### 対策
- **有料プランへのアップグレード**（$7/月〜）
- **定期的なヘルスチェック**（cron job等で定期的にアクセス）

---

## 💡 ベストプラクティス

### 1. 環境変数の管理

✅ **DO:**
- Renderダッシュボードで管理
- 機密情報はGitにコミットしない
- 本番用に新しい`SECRET_KEY`を生成

❌ **DON'T:**
- `.env`ファイルをGitにコミット
- 開発環境と同じ認証情報を使用
- ハードコードされた設定

### 2. デプロイ

✅ **DO:**
- `main`ブランチにマージ後、自動デプロイ
- ログを確認してエラーチェック
- ヘルスチェックエンドポイントを実装

❌ **DON'T:**
- 直接本番環境で変更
- テストなしでデプロイ
- エラーログを無視

### 3. モニタリング

✅ **DO:**
- Sentryなどのエラー監視を導入
- Renderのログを定期的に確認
- アップタイムモニタリングを設定

---

## 🔗 参考リンク

- [Render公式ドキュメント](https://render.com/docs)
- [FastAPIデプロイガイド](https://fastapi.tiangolo.com/deployment/)
- [Vercelデプロイガイド](https://vercel.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)

---

## 🆘 サポート

問題が発生した場合:

1. **Renderのログを確認**
   - Dashboard → Service → Logs

2. **環境変数を確認**
   - Dashboard → Service → Environment

3. **ヘルスチェックを実行**
   ```bash
   curl https://qupid-api.onrender.com/health
   ```

4. **コミュニティに質問**
   - Render Community: https://community.render.com/

---

**Render.comへのデプロイ、おめでとうございます！🎉**

