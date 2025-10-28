# 📧 メール認証システム アーキテクチャ

## 🏗️ システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                         クライアント                              │
│                    (Web/Mobile Browser)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI バックエンド                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              レート制限ミドルウェア                          │ │
│  │  • APIレート制限: 100 req/min                              │ │
│  │  • メールレート制限: 10 emails/hour                         │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
│                   ▼                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            メール認証エンドポイント                          │ │
│  │  • POST /auth/email/send-code                              │ │
│  │  • POST /auth/email/verify-code                            │ │
│  │  • POST /auth/email/resend-code                            │ │
│  │  • POST /auth/email/reset-password                         │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
│                   ▼                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                メールサービス                                │ │
│  │  • 認証コード生成 (6桁)                                     │ │
│  │  • HTMLメール送信                                           │ │
│  │  • リトライロジック (最大3回)                               │ │
│  │  • エラーハンドリング                                       │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
└───────────────────┼───────────────────────────────────────────────┘
                    │
                    │ SMTP
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    メールプロバイダー                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Gmail     │  │   SendGrid   │  │    Amazon SES        │  │
│  │ 500通/日     │  │  100通/日    │  │  1,000通 = $0.10     │  │
│  │   (無料)     │  │   (無料)     │  │     (従量課金)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        エンドユーザー                             │
│                    (メール受信トレイ)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  認証コード  │  │ ウェルカム   │  │ パスワードリセット    │  │
│  │    メール    │  │   メール     │  │     メール           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 メール送信フロー

### 1. 認証コード送信フロー

```
ユーザー                バックエンド            データベース        メールサービス
   │                        │                       │                    │
   │  POST /send-code       │                       │                    │
   ├───────────────────────>│                       │                    │
   │                        │                       │                    │
   │                        │ レート制限チェック    │                    │
   │                        ├──────────────────────>│                    │
   │                        │                       │                    │
   │                        │ 既存コード無効化      │                    │
   │                        ├──────────────────────>│                    │
   │                        │                       │                    │
   │                        │ 新規コード生成        │                    │
   │                        │ (6桁)                 │                    │
   │                        │                       │                    │
   │                        │ コード保存            │                    │
   │                        ├──────────────────────>│                    │
   │                        │                       │                    │
   │                        │ メール送信リクエスト  │                    │
   │                        ├───────────────────────────────────────────>│
   │                        │                       │                    │
   │                        │                       │     SMTP送信       │
   │                        │                       │  ┌────────────┐   │
   │                        │                       │  │ リトライ1  │   │
   │                        │                       │  │ リトライ2  │   │
   │                        │                       │  │ リトライ3  │   │
   │                        │                       │  └────────────┘   │
   │                        │                       │                    │
   │                        │ メール送信成功        │                    │
   │                        │<───────────────────────────────────────────│
   │                        │                       │                    │
   │  Response (200 OK)     │                       │                    │
   │<───────────────────────│                       │                    │
   │                        │                       │                    │
```

### 2. コード検証フロー

```
ユーザー                バックエンド            データベース        
   │                        │                       │
   │  POST /verify-code     │                       │
   │  {email, code}         │                       │
   ├───────────────────────>│                       │
   │                        │                       │
   │                        │ コード検証            │
   │                        ├──────────────────────>│
   │                        │ • 有効期限チェック    │
   │                        │ • 未使用チェック      │
   │                        │                       │
   │                        │ ユーザー検索          │
   │                        ├──────────────────────>│
   │                        │                       │
   │                        │ 【新規ユーザー】      │
   │                        │ パスワード必要？      │
   │                        │                       │
   │  requires_password     │                       │
   │<───────────────────────│                       │
   │                        │                       │
   │  POST /verify-code     │                       │
   │  {email, code, pass}   │                       │
   ├───────────────────────>│                       │
   │                        │                       │
   │                        │ ユーザー作成          │
   │                        ├──────────────────────>│
   │                        │                       │
   │                        │ コード有効化          │
   │                        ├──────────────────────>│
   │                        │                       │
   │                        │ トークン生成          │
   │                        │ (JWT)                 │
   │                        │                       │
   │  Response              │                       │
   │  {token, user}         │                       │
   │<───────────────────────│                       │
   │                        │                       │
```

---

## 🔐 セキュリティレイヤー

```
┌─────────────────────────────────────────────────────────────┐
│                      セキュリティレイヤー                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1️⃣ レート制限                                                │
│     └─ IPアドレスベース                                       │
│     └─ メール: 10通/時間                                      │
│     └─ API: 100リクエスト/分                                  │
│                                                               │
│  2️⃣ 認証コード                                                │
│     └─ 6桁のランダムコード                                    │
│     └─ 10分で自動失効                                         │
│     └─ 1回限りの使用                                          │
│                                                               │
│  3️⃣ ドメイン制限                                              │
│     └─ s.kyushu-u.ac.jp のみ許可                             │
│                                                               │
│  4️⃣ HTTPS/TLS                                                 │
│     └─ すべての通信を暗号化                                   │
│                                                               │
│  5️⃣ エラーハンドリング                                         │
│     └─ 詳細なログ記録                                         │
│     └─ ユーザーフレンドリーなエラーメッセージ                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 データフロー

### データベーススキーマ

```sql
-- EmailVerification テーブル
CREATE TABLE email_verification (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_email_verification_email ON email_verification(email);
CREATE INDEX idx_email_verification_code ON email_verification(verification_code);
CREATE INDEX idx_email_verification_expires ON email_verification(expires_at);
```

### メール送信ログ（推奨）

```sql
-- EmailLog テーブル（今後の実装）
CREATE TABLE email_log (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL,  -- verification, welcome, reset
    status VARCHAR(20) NOT NULL,      -- success, failed, retry
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧩 コンポーネント詳細

### 1. メールテンプレート (`app/templates/email_templates.py`)

```python
# 3種類のメールテンプレート
├── 認証コードメール
│   ├── HTML版 (get_verification_email_html)
│   └── プレーンテキスト版 (get_verification_email_text)
├── ウェルカムメール
│   ├── HTML版 (get_welcome_email_html)
│   └── プレーンテキスト版 (get_welcome_email_text)
└── パスワードリセットメール
    ├── HTML版 (get_password_reset_email_html)
    └── プレーンテキスト版 (get_password_reset_email_text)
```

### 2. メールサービス (`app/services/email_service.py`)

```python
class EmailService:
    ├── __init__()                      # 設定の初期化
    ├── generate_verification_code()    # 6桁コード生成
    ├── _send_email_with_retry()        # リトライロジック
    ├── send_verification_email()       # 認証メール送信
    ├── send_welcome_email()            # ウェルカムメール送信
    └── send_password_reset_email()     # パスワードリセットメール送信
```

### 3. レート制限 (`app/middleware/rate_limit.py`)

```python
class RateLimiter:
    ├── _get_client_id()                # クライアント識別
    ├── _clean_old_requests()           # 古いリクエスト削除
    ├── check_rate_limit()              # APIレート制限
    ├── check_email_rate_limit()        # メールレート制限
    └── reset_client()                  # リセット（テスト用）
```

---

## 🎯 エンドポイント一覧

| エンドポイント | メソッド | 説明 | レート制限 |
|------------|---------|------|----------|
| `/auth/email/send-code` | POST | 認証コード送信 | 10通/時間 |
| `/auth/email/verify-code` | POST | コード検証 | - |
| `/auth/email/resend-code` | POST | コード再送信 | 10通/時間 |
| `/auth/email/reset-password` | POST | パスワードリセット | - |

---

## 📈 パフォーマンス指標

### レスポンスタイム（目標）

```
認証コード送信:
├── データベースクエリ: < 50ms
├── メール送信: < 2s (成功時)
├── メール送信: < 10s (リトライ時)
└── 合計: < 2.5s

コード検証:
├── データベースクエリ: < 50ms
├── ユーザー作成: < 100ms
├── トークン生成: < 10ms
└── 合計: < 200ms
```

### スループット

```
API全体: 100 req/min
メール送信: 10 emails/hour
同時接続: 100+ concurrent users
```

---

## 🔄 エラーハンドリング

### エラー階層

```
1. ユーザーエラー (400系)
   ├── 400 Bad Request: 無効なリクエスト
   ├── 401 Unauthorized: 認証失敗
   └── 429 Too Many Requests: レート制限超過

2. サーバーエラー (500系)
   ├── 500 Internal Server Error: 予期しないエラー
   └── 503 Service Unavailable: メール送信失敗

3. ログレベル
   ├── ERROR: 致命的エラー（SMTP認証失敗など）
   ├── WARNING: リトライ可能エラー（一時的な接続失敗）
   └── INFO: 正常動作（メール送信成功など）
```

---

## 🧪 テスト戦略

### 単体テスト

```python
# メールサービスのテスト
├── test_generate_verification_code()  # コード生成
├── test_send_verification_email()     # 認証メール送信
├── test_send_welcome_email()          # ウェルカムメール送信
└── test_retry_logic()                 # リトライロジック

# レート制限のテスト
├── test_rate_limit_check()            # レート制限チェック
├── test_email_rate_limit()            # メールレート制限
└── test_rate_limit_reset()            # リセット機能
```

### 統合テスト

```python
# エンドツーエンドテスト
├── test_email_authentication_flow()   # 完全な認証フロー
├── test_password_reset_flow()         # パスワードリセットフロー
└── test_rate_limit_enforcement()      # レート制限の実施
```

---

## 🎓 ベストプラクティス

### 1. メール送信

```python
✅ DO:
- HTMLとプレーンテキストの両方を送信
- リトライロジックを実装
- タイムアウトを設定
- 詳細なログを記録

❌ DON'T:
- ブロッキング処理（必ず非同期で）
- エラーを無視
- 無制限のリトライ
```

### 2. セキュリティ

```python
✅ DO:
- レート制限を実装
- 認証コードの有効期限を設定
- ドメイン制限を実装
- HTTPS/TLSを使用

❌ DON'T:
- 認証コードをログに記録
- エラーメッセージで内部情報を漏らす
- レート制限なしで公開
```

### 3. パフォーマンス

```python
✅ DO:
- 非同期処理を使用
- データベースクエリを最適化
- キャッシュを活用
- 適切なインデックスを作成

❌ DON'T:
- 同期的なメール送信
- N+1クエリ問題
- 大量のデータをメモリに保持
```

---

## 🔮 スケーラビリティ

### 現在のアーキテクチャ

```
単一サーバー
├── インメモリレート制限
├── 同期的なSMTP接続
└── 制限: ~100ユーザー/時間
```

### スケールアウト戦略

```
分散システム
├── Redis (レート制限キャッシュ)
├── Celery (バックグラウンドジョブ)
├── RabbitMQ/SQS (メッセージキュー)
└── 制限: 10,000+ユーザー/時間
```

---

## 📚 参考資料

- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [Python smtplib](https://docs.python.org/3/library/smtplib.html)
- [Gmail API](https://developers.google.com/gmail/api)
- [SendGrid API](https://docs.sendgrid.com/)
- [Amazon SES](https://aws.amazon.com/ses/)

---

**システムアーキテクチャドキュメント完成！🎉**

