# 📧 メール認証システム クイックスタートガイド

本番環境でメール認証システムを5分で設定する方法

---

## 🚀 5分でセットアップ

### Step 1: Gmailアプリパスワードを取得（2分）

1. **Google アカウントにログイン**
   - https://myaccount.google.com/security

2. **2段階認証を有効化**（まだの場合）
   - 「2段階認証プロセス」をクリック
   - 指示に従って有効化

3. **アプリパスワードを生成**
   - https://myaccount.google.com/apppasswords
   - アプリを選択: **メール**
   - デバイスを選択: **その他（カスタム名）** → 「Qupid」と入力
   - **生成** をクリック
   - 🔑 **16文字のパスワードをコピー**（スペースは除去）

### Step 2: 環境変数を設定（2分）

プロジェクトルートに `.env` ファイルを作成：

```bash
# .env ファイルを作成
cp env.template .env
```

以下の環境変数を編集：

```bash
# 本番環境に設定
APP_ENV=production
ENABLE_EMAIL=true

# Gmailの設定
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com  # ← あなたのGmailアドレス
SMTP_PASSWORD=xxxx xxxx xxxx xxxx   # ← Step 1で取得した16文字のパスワード
FROM_EMAIL=your-email@gmail.com     # ← あなたのGmailアドレス
```

💡 **重要:** `SMTP_PASSWORD` のスペースは除去してください！

### Step 3: テスト（1分）

```bash
# メール送信をテスト
python dev_tools/test_email_service.py --email your-test-email@example.com

# 成功すると以下が表示されます:
# ✅ 認証メール送信成功
# ✅ ウェルカムメール送信成功
# ✅ パスワードリセットメール送信成功
```

### ✅ 完了！

メール認証システムが稼働しています。

---

## 🎯 よくある問題と解決方法

### ❌ "SMTP Authentication Error"

**原因:** パスワードが間違っている

**解決方法:**
1. アプリパスワードを再生成
2. スペースを除去
3. `.env` ファイルに正しく設定されているか確認

### ❌ メールが届かない

**原因:** スパムフォルダに入っている可能性

**解決方法:**
1. スパムフォルダを確認
2. Gmail の設定で「安全性の低いアプリのアクセス」を確認
3. テストメールを別のメールアドレスで試す

### ❌ "Connection timeout"

**原因:** ファイアウォールがSMTPポートをブロックしている

**解決方法:**
1. ポート587が開いているか確認
2. ネットワーク設定を確認
3. 別のSMTPポート（465）を試す

---

## 📝 本番環境のベストプラクティス

### 1. SendGridへの移行（推奨）

Gmailは小規模向けです。本格的な運用には**SendGrid**を推奨します：

```bash
# SendGridの設定例
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

**メリット:**
- 無料で1日100通まで
- 高い到達率
- 詳細な分析

### 2. レート制限の調整

デフォルトでは1時間に10通までです。調整する場合：

```bash
# .env
EMAIL_RATE_LIMIT_PER_HOUR=20  # 1時間あたり20通に増やす
```

### 3. エラー監視

Sentryなどのエラー監視サービスを導入：

```bash
# .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## 🔗 次のステップ

- 📖 [詳細なセットアップガイド](./EMAIL_PRODUCTION_SETUP.md)
- 🔒 [セキュリティベストプラクティス](./SECURITY_AUDIT.md)
- 🚀 [本番環境デプロイガイド](./PRODUCTION_SETUP.md)

---

**メール認証システムの設定が完了しました！🎉**

