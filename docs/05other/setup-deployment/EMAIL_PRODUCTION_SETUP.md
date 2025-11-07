# 📧 本番環境メール認証システムセットアップガイド

## 📋 概要

本ガイドでは、Qupidアプリケーションの本番環境でメール認証システムを設定する方法を説明します。

---

## 🔧 1. メールサービスプロバイダーの選択

### Gmail（推奨：開発・小規模）

**利点:**
- 無料で使える
- 設定が簡単
- 信頼性が高い

**制限:**
- 1日あたり500通まで
- アプリパスワードが必要

**設定手順:**

1. **Googleアカウントで2段階認証を有効化**
   - https://myaccount.google.com/security にアクセス
   - 「2段階認証プロセス」を有効化

2. **アプリパスワードを生成**
   - https://myaccount.google.com/apppasswords にアクセス
   - 「アプリを選択」→「メール」
   - 「デバイスを選択」→「その他（カスタム名）」→「Qupid」
   - 生成された16文字のパスワードをコピー

3. **環境変数を設定**
```bash
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=qudai.qupid@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_EMAIL=qudai.qupid@gmail.com
```

### SendGrid（推奨：中〜大規模）

**利点:**
- 無料プランで1日100通まで
- 高い到達率
- 詳細な分析機能
- APIも利用可能

**制限:**
- アカウント作成が必要
- ドメイン認証が推奨

**設定手順:**

1. **SendGridアカウントを作成**
   - https://sendgrid.com/ でサインアップ
   - 無料プランを選択

2. **APIキーを作成**
   - Settings → API Keys
   - 「Create API Key」をクリック
   - 名前を「Qupid」に設定
   - 「Full Access」を選択
   - APIキーをコピー（1度しか表示されません）

3. **環境変数を設定**
```bash
ENABLE_EMAIL=true
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

### Amazon SES（推奨：大規模）

**利点:**
- 非常に安い（1,000通で$0.10）
- 高い信頼性
- AWS統合

**制限:**
- AWS アカウントが必要
- 初期はサンドボックスモード（検証済みアドレスのみ）
- 本番移行申請が必要

**設定手順:**

1. **AWS アカウントでSESを有効化**
   - AWS Console → SES
   - リージョンを選択（例: us-east-1）

2. **メールアドレスを検証**
   - 「Email Addresses」→「Verify a New Email Address」
   - 送信元メールアドレスを入力
   - 検証メールのリンクをクリック

3. **SMTP認証情報を作成**
   - 「SMTP Settings」→「Create My SMTP Credentials」
   - ユーザー名とパスワードをコピー

4. **環境変数を設定**
```bash
ENABLE_EMAIL=true
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
FROM_EMAIL=noreply@yourdomain.com
```

---

## ⚙️ 2. 環境変数の設定

### 必須の環境変数

```bash
# アプリケーション設定
APP_NAME=Qupid
APP_ENV=production

# メール送信設定（必須）
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-password-or-api-key
FROM_EMAIL=noreply@qupid.com

# メール送信のリトライ設定
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=2

# レート制限設定
EMAIL_RATE_LIMIT_PER_HOUR=10
API_RATE_LIMIT_PER_MINUTE=100

# データベース
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/qupid

# セキュリティ
SECRET_KEY=your-generated-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ドメイン制限
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp
```

### 環境変数の設定方法

**Render.com:**
1. Dashboard → Service → Environment
2. 各環境変数を追加
3. 「Save Changes」をクリック

**Heroku:**
```bash
heroku config:set ENABLE_EMAIL=true
heroku config:set SMTP_SERVER=smtp.gmail.com
# ... 他の環境変数も同様に設定
```

**Docker Compose:**
```yaml
environment:
  - ENABLE_EMAIL=true
  - SMTP_SERVER=smtp.gmail.com
  - SMTP_PORT=587
  # ... 他の環境変数
```

**直接.envファイル:**
```bash
# .env ファイルを作成
cp .env.example .env

# エディタで編集
nano .env
```

---

## 🧪 3. メール送信のテスト

### テストツールの使用

```bash
# すべてのメールタイプをテスト
python dev_tools/test_email_service.py --email your-test@example.com

# 認証メールのみテスト
python dev_tools/test_email_service.py --email your-test@example.com --type verification

# ウェルカムメールのみテスト
python dev_tools/test_email_service.py --email your-test@example.com --type welcome

# 現在の設定を表示
python dev_tools/test_email_service.py --show-settings
```

### 手動テスト（APIエンドポイント経由）

```bash
# 認証コードの送信
curl -X POST "https://your-api.com/auth/email/send-code" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@s.kyushu-u.ac.jp"}'

# レスポンス例（開発環境）
{
  "message": "認証コードを送信しました",
  "verification_id": 123,
  "verification_code": "123456"  // 開発環境のみ
}
```

---

## 🔒 4. セキュリティのベストプラクティス

### ✅ 必ず実装すべきこと

1. **HTTPS/TLSの有効化**
   - すべての通信を暗号化
   - Let's Encryptで無料のSSL証明書を取得

2. **レート制限**
   - メール送信: 1時間あたり10通まで（デフォルト）
   - API呼び出し: 1分あたり100リクエストまで（デフォルト）

3. **メールドメイン制限**
   - 信頼できるドメインのみ許可（例: s.kyushu-u.ac.jp）

4. **認証コードの有効期限**
   - 10分で自動失効（デフォルト）

5. **環境変数の保護**
   - `.env`ファイルをGit管理下に置かない
   - `.gitignore`に追加されていることを確認

### 🔐 推奨事項

1. **SPF、DKIM、DMARCレコードの設定**
   - メールの到達率を向上
   - スパム判定を回避

2. **送信元ドメインの認証**
   - カスタムドメインを使用
   - SendGridやSESでドメイン認証を設定

3. **エラー監視**
   - Sentryなどでメール送信エラーを監視
   - 失敗したメールを記録

4. **ログの記録**
   - メール送信の成功/失敗をログに記録
   - 不正利用を検出

---

## 📊 5. 監視とトラブルシューティング

### メール送信の監視

```python
# app/services/email_service.py のログを確認
import logging
logger = logging.getLogger(__name__)

# ログレベルの設定
logger.setLevel(logging.INFO)
```

### よくある問題と解決方法

#### 問題1: メールが届かない

**原因:**
- SMTP認証情報が間違っている
- スパムフォルダに振り分けられている
- メールプロバイダーがブロックしている

**解決方法:**
```bash
# 設定を確認
python dev_tools/test_email_service.py --show-settings

# テストメールを送信
python dev_tools/test_email_service.py --email your-email@example.com

# ログを確認
tail -f backend.log | grep "メール"
```

#### 問題2: SMTP認証エラー

**症状:** `SMTP Authentication Error`

**解決方法:**
1. SMTP_USERNAMEとSMTP_PASSWORDが正しいか確認
2. Gmailの場合、アプリパスワードを使用しているか確認
3. 2段階認証が有効になっているか確認

#### 問題3: レート制限に引っかかる

**症状:** `429 Too Many Requests`

**解決方法:**
```bash
# レート制限を調整
# .env ファイルで設定
EMAIL_RATE_LIMIT_PER_HOUR=20  # デフォルト: 10
API_RATE_LIMIT_PER_MINUTE=200  # デフォルト: 100
```

#### 問題4: タイムアウトエラー

**症状:** `SMTP timeout`

**解決方法:**
- ネットワーク接続を確認
- ファイアウォール設定を確認
- SMTP_PORTが正しいか確認（587または465）

---

## 📈 6. パフォーマンスの最適化

### メール送信の非同期化

メールサービスは既に非同期化されています：

```python
# 非同期でメール送信
await email_service.send_verification_email(email, code)
```

### リトライロジック

自動リトライが実装されています：

- 最大リトライ回数: 3回（デフォルト）
- リトライ間隔: 2秒（指数バックオフ）
- SMTP認証エラーは即座に失敗

### キャッシュとキュー

大規模な場合は、以下の実装を検討：

1. **Redis+Celeryでバックグラウンドジョブ化**
```python
# 例: Celeryタスク
@celery_app.task
def send_email_task(email, code):
    asyncio.run(email_service.send_verification_email(email, code))
```

2. **メール送信キューの実装**
```python
# 例: RabbitMQやAWS SQSを使用
```

---

## ✅ デプロイ前チェックリスト

### 環境設定
- [ ] `APP_ENV=production` に設定
- [ ] `ENABLE_EMAIL=true` に設定
- [ ] SMTP認証情報が正しく設定されている
- [ ] `SECRET_KEY`が本番用に生成されている

### セキュリティ
- [ ] HTTPS/TLSが有効化されている
- [ ] レート制限が設定されている
- [ ] メールドメイン制限が設定されている
- [ ] `.env`ファイルがGit管理下にない

### テスト
- [ ] テストメールが正常に送信される
- [ ] 認証フローが正しく動作する
- [ ] レート制限が正しく機能する
- [ ] エラーハンドリングが適切に動作する

### 監視
- [ ] Sentryなどのエラー監視が設定されている
- [ ] ログが適切に記録されている
- [ ] メール送信の成功率を監視している

---

## 🆘 サポート

問題が発生した場合:

1. **ログを確認**
   ```bash
   tail -f backend.log | grep "email"
   ```

2. **テストツールを実行**
   ```bash
   python dev_tools/test_email_service.py --email test@example.com
   ```

3. **設定を確認**
   ```bash
   python dev_tools/test_email_service.py --show-settings
   ```

4. **デバッグモードで実行**
   ```bash
   # .env
   APP_ENV=development
   # コンソールにメール内容が出力されます
   ```

---

## 📚 関連ドキュメント

- [本番環境セットアップガイド](./PRODUCTION_SETUP.md)
- [セキュリティ監査](./SECURITY_AUDIT.md)
- [API ドキュメント](http://your-api.com/docs)

---

## 🎯 まとめ

本番環境でメール認証システムを正しく設定することで、以下のメリットが得られます：

✅ **セキュアな認証フロー**
- メールアドレスの検証
- パスワードリセット機能
- スパムや不正利用の防止

✅ **高い信頼性**
- 自動リトライロジック
- 詳細なエラーハンドリング
- HTMLとプレーンテキストの両対応

✅ **優れたユーザー体験**
- 美しいHTMLメール
- 迅速な配信
- 明確なエラーメッセージ

**本番環境へのデプロイ、おめでとうございます！🎉**

