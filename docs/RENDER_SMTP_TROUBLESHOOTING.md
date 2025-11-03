# Render SMTP接続トラブルシューティングガイド

## エラー: `[Errno 101] Network is unreachable`

このエラーは、RenderのサーバーからGmailのSMTPサーバー（smtp.gmail.com:587）への接続ができない場合に発生します。

## 確認手順

### 1. Render環境変数の確認

Renderのダッシュボードで以下を確認してください：

1. **Render Dashboard** → **Environment** タブ
2. 以下の環境変数が正しく設定されているか確認：
   - `SMTP_PASSWORD`: **必須** - Gmailのアプリパスワード（16文字）
   - `SMTP_USERNAME`: `qudai.qupid@gmail.com`
   - `ENABLE_EMAIL`: `true`
   - `SMTP_SERVER`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`

### 2. Gmailアプリパスワードの確認

Gmailのアプリパスワードが正しく設定されているか確認：

1. Googleアカウント → **セキュリティ** → **2段階認証プロセス** が有効になっているか確認
2. **アプリパスワード**を生成（16文字のパスワード）
3. Renderの環境変数 `SMTP_PASSWORD` に設定（スペースなし）

### 3. Renderのネットワーク制限の確認

Renderの無料プランでは、**外部SMTPサーバーへの接続が制限されている可能性**があります。

#### 解決策A: ポート465（SSL）を試す

`render.yaml`を更新してポート465を使用：

```yaml
envVars:
  - key: SMTP_PORT
    value: 465
```

また、`app/services/email_service.py`でSSL接続を使用するように変更が必要です：

```python
# ポート465の場合はSMTP_SSLを使用
if self.smtp_port == 465:
    with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, timeout=30) as server:
        if self.smtp_username and self.smtp_password:
            server.login(self.smtp_username, self.smtp_password)
        server.send_message(msg)
else:
    # ポート587の場合はSTARTTLS
    with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30) as server:
        server.starttls()
        if self.smtp_username and self.smtp_password:
            server.login(self.smtp_username, self.smtp_password)
        server.send_message(msg)
```

#### 解決策B: SendGridなどのメール送信サービスを使用（推奨）

Renderの無料プランでも動作が安定している代替案：

**SendGrid（推奨）:**
- 無料で1日100通まで
- Renderから接続可能
- 高い到達率

```yaml
envVars:
  - key: SMTP_SERVER
    value: smtp.sendgrid.net
  - key: SMTP_PORT
    value: 587
  - key: SMTP_USERNAME
    value: apikey
  - key: SMTP_PASSWORD
    value: YOUR_SENDGRID_API_KEY  # SendGrid APIキー
```

**Mailgun:**
- 無料で1ヶ月5000通まで

**Resend:**
- 無料で1ヶ月3000通まで
- モダンなAPI

### 4. ログでSMTP設定を確認

Renderのログで以下を確認してください：

```
EmailService初期化: ENABLE_EMAIL=True, SMTP_SERVER=smtp.gmail.com, SMTP_PORT=587, SMTP_USERNAME=qudai.qupid@gmail.com, SMTP_PASSWORD設定済み=True
```

`SMTP_PASSWORD設定済み=False` の場合は、環境変数が正しく設定されていません。

### 5. 一時的な回避策（開発環境のみ）

本番環境でメール送信ができない場合、一時的に開発モードとして動作させる：

```yaml
envVars:
  - key: APP_ENV
    value: development  # 一時的にdevelopmentに変更
```

**注意:** 開発環境ではメールは送信されず、ログに認証コードが出力されます。

## デバッグ用エンドポイントの追加（オプション）

SMTP接続をテストするエンドポイントを追加：

```python
# app/routers/email_auth.py
@router.get("/test-smtp")
async def test_smtp_connection():
    """SMTP接続をテスト"""
    from app.services.email_service import email_service
    from app.core.config import settings
    
    return {
        "smtp_server": email_service.smtp_server,
        "smtp_port": email_service.smtp_port,
        "smtp_username": email_service.smtp_username,
        "password_set": bool(email_service.smtp_password),
        "enable_email": email_service.enable_email,
        "from_email": email_service.from_email,
    }
```

## 次のステップ

1. Renderのログを確認して、詳細なエラーメッセージを確認
2. `SMTP_PASSWORD`環境変数が正しく設定されているか確認
3. 上記の解決策を試す
4. まだ解決しない場合は、SendGridなどのメール送信サービスへの移行を検討

## 関連ドキュメント

- [メール送信システム概要](./EMAIL_SYSTEM_SUMMARY.md)
- [本番環境メール設定](./EMAIL_PRODUCTION_SETUP.md)
- [クイックスタートガイド](./EMAIL_QUICK_START.md)

