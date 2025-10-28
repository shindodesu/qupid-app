# 🔒 セキュリティ監査ガイド

## 📋 概要

このドキュメントでは、Qupidアプリケーションのセキュリティを監査・強化するための手順とチェックリストを提供します。

---

## 🛡️ セキュリティチェックリスト

### 認証・認可

- [ ] パスワードが適切にハッシュ化されている（bcrypt使用）
- [ ] JWT トークンが安全に生成・検証されている
- [ ] トークンの有効期限が適切に設定されている（7日間）
- [ ] CSRF対策が実装されている
- [ ] セッション管理が適切に行われている
- [ ] ログアウト機能が正しく動作している
- [ ] パスワードリセット機能が安全である

### データ保護

- [ ] データベース接続が暗号化されている（SSL/TLS）
- [ ] 機密情報が環境変数で管理されている
- [ ] ログに機密情報が出力されていない
- [ ] ユーザーデータが適切に暗号化されている
- [ ] バックアップが暗号化されている

### ネットワークセキュリティ

- [ ] HTTPS/TLSが有効化されている
- [ ] CORS設定が適切である
- [ ] レート制限が実装されている
- [ ] DDoS対策が施されている
- [ ] Firewall設定が適切である

### 入力検証

- [ ] すべての入力がバリデーションされている
- [ ] SQL インジェクション対策が施されている
- [ ] XSS 対策が施されている
- [ ] CSRF トークンが使用されている
- [ ] ファイルアップロードが安全である

### 依存関係

- [ ] 依存関係に既知の脆弱性がない
- [ ] 定期的にセキュリティアップデートを適用している
- [ ] 不要な依存関係が削除されている

---

## 🔍 セキュリティ監査手順

### 1. 依存関係の脆弱性スキャン

#### バックエンド（Python）

```bash
# pip-audit をインストール
pip install pip-audit

# 脆弱性スキャン実行
pip-audit

# 修正可能な脆弱性を自動修正
pip-audit --fix
```

#### フロントエンド（Node.js）

```bash
# npm audit
npm audit

# 自動修正
npm audit fix

# 強制的に修正（破壊的変更の可能性あり）
npm audit fix --force
```

### 2. Snyk によるスキャン

```bash
# Snyk CLI をインストール
npm install -g snyk

# ログイン
snyk auth

# バックエンドをスキャン
cd /path/to/Qupid
snyk test --file=requirements.txt

# フロントエンドをスキャン
cd /path/to/Qupid/frontend
snyk test
```

### 3. OWASP ZAP によるペネトレーションテスト

```bash
# OWASP ZAP をダウンロード
# https://www.zaproxy.org/download/

# CLI モードで実行
zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' \
  https://yourdomain.com
```

### 4. SSL/TLS 設定の確認

```bash
# SSL Labs で確認
# https://www.ssllabs.com/ssltest/

# または OpenSSL で確認
openssl s_client -connect yourdomain.com:443 -tls1_2
```

---

## 🔐 セキュリティ強化策

### 1. レート制限の実装

#### バックエンド

```python
# requirements.txt に追加
# slowapi

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ルートにレート制限を適用
@router.post("/auth/login")
@limiter.limit("5/minute")  # 1分間に5回まで
async def login(request: Request, payload: LoginRequest):
    # ...
    pass
```

#### フロントエンド

```typescript
// クライアントサイドでのレート制限
import { rateLimit } from '@/lib/rateLimit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1分
  uniqueTokenPerInterval: 500,
})

export async function POST(request: Request) {
  try {
    await limiter.check(5, 'CACHE_TOKEN') // 5リクエスト/分
  } catch {
    return new Response('Rate limit exceeded', { status: 429 })
  }
  // ...
}
```

### 2. Content Security Policy (CSP)

`next.config.ts` で既に実装済み：

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...",
        },
        // ...
      ],
    },
  ]
}
```

### 3. Helmet によるセキュリティヘッダー

#### バックエンド

```python
# requirements.txt に追加
# secure

from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# HTTPS リダイレクト（本番環境のみ）
if settings.APP_ENV == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# 信頼できるホストのみ許可
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.com", "www.yourdomain.com", "api.yourdomain.com"]
)

# セキュリティヘッダー
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

### 4. SQLインジェクション対策

SQLAlchemy を使用することで自動的に対策済み：

```python
# ❌ 危険：文字列連結
query = f"SELECT * FROM users WHERE email = '{email}'"

# ✅ 安全：パラメータバインディング
query = select(User).where(User.email == email)
```

### 5. XSS対策

React は自動的にエスケープしますが、`dangerouslySetInnerHTML` は避ける：

```tsx
// ❌ 危険
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 安全
<div>{userInput}</div>

// ❓ 必要な場合は DOMPurify を使用
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 6. ファイルアップロードのセキュリティ

`app/routers/files.py` で既に実装済み：

```python
# ファイルタイプの検証
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# ファイルサイズの制限
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# ファイル名のサニタイズ
def sanitize_filename(filename: str) -> str:
    # 危険な文字を削除
    return "".join(c for c in filename if c.isalnum() or c in "._-")
```

---

## 🚨 インシデント対応

### 1. セキュリティインシデントの検出

#### ログ監視

```python
# app/core/security_logger.py
import logging

security_logger = logging.getLogger("security")

def log_security_event(event_type: str, user_id: int, details: dict):
    security_logger.warning(
        f"Security Event: {event_type}",
        extra={
            "event_type": event_type,
            "user_id": user_id,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
    )

# 使用例
log_security_event(
    "failed_login_attempt",
    user_id=None,
    details={"email": email, "ip": request.client.host}
)
```

### 2. インシデント対応手順

1. **検出**: Sentry、ログ、監視ツールでインシデントを検出
2. **隔離**: 影響を受けたアカウント/サービスを隔離
3. **調査**: ログとデータを分析し、原因を特定
4. **修正**: 脆弱性を修正し、パッチを適用
5. **通知**: 影響を受けたユーザーに通知
6. **報告**: インシデントレポートを作成
7. **改善**: 再発防止策を実装

### 3. データ漏洩時の対応

```bash
# 1. すべてのセッションを無効化
python scripts/invalidate_all_sessions.py

# 2. SECRET_KEY を再生成
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 3. データベースパスワードを変更
# 4. APIキーを再発行
# 5. ユーザーにパスワード変更を要請
```

---

## 📊 セキュリティ監視

### Sentry でのセキュリティイベント追跡

```python
import sentry_sdk

# セキュリティイベントをSentryに送信
def report_security_event(event_type: str, details: dict):
    sentry_sdk.capture_message(
        f"Security Event: {event_type}",
        level="warning",
        extras=details
    )
```

### ログ分析

```bash
# 失敗したログイン試行を検索
grep "failed_login_attempt" /var/log/qupid/security.log | wc -l

# 特定IPからの試行回数
grep "failed_login_attempt" /var/log/qupid/security.log | \
  grep "ip: 192.168.1.1" | wc -l
```

---

## 🔧 セキュリティテスト

### 1. 認証テスト

```python
# tests/test_security_auth.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_rate_limiting(client: AsyncClient):
    """ログインのレート制限をテスト"""
    for i in range(10):
        response = await client.post(
            "/auth/login",
            json={"email": "test@test.com", "password": "wrong"}
        )
        if i < 5:
            assert response.status_code in [401, 400]
        else:
            assert response.status_code == 429  # Too Many Requests

@pytest.mark.asyncio
async def test_jwt_expiration(client: AsyncClient):
    """JWTトークンの有効期限をテスト"""
    # トークンを取得
    login_response = await client.post(
        "/auth/login",
        json={"email": "test@test.com", "password": "Test1234"}
    )
    token = login_response.json()["token"]
    
    # 有効期限切れのトークンをシミュレート
    import time
    time.sleep(60 * 60 * 24 * 8)  # 8日後
    
    response = await client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401
```

### 2. SQLインジェクションテスト

```python
@pytest.mark.asyncio
async def test_sql_injection_protection(client: AsyncClient):
    """SQLインジェクション対策をテスト"""
    malicious_input = "admin'; DROP TABLE users; --"
    
    response = await client.post(
        "/auth/login",
        json={"email": malicious_input, "password": "test"}
    )
    
    # エラーが返されるが、SQLは実行されない
    assert response.status_code in [400, 401, 422]
    
    # データベースが影響を受けていないことを確認
    users = await db.execute(select(User))
    assert users.scalars().all()  # テーブルが存在する
```

### 3. XSSテスト

```tsx
// __tests__/security/xss.test.tsx
import { render, screen } from '@testing-library/react'
import UserProfile from '@/components/UserProfile'

test('XSS攻撃から保護されている', () => {
  const maliciousInput = '<script>alert("XSS")</script>'
  
  render(<UserProfile bio={maliciousInput} />)
  
  // スクリプトが実行されずテキストとして表示される
  expect(screen.getByText(maliciousInput)).toBeInTheDocument()
  
  // script タグが HTML に含まれていない
  const element = screen.getByTestId('user-bio')
  expect(element.innerHTML).not.toContain('<script>')
})
```

---

## 📚 セキュリティベストプラクティス

### 開発時

1. **最小権限の原則**: 必要最小限の権限のみ付与
2. **デフォルトで安全**: デフォルト設定を安全に
3. **深層防御**: 複数のセキュリティ層を実装
4. **入力検証**: すべての入力を信頼しない
5. **エラーメッセージ**: 詳細な情報を漏らさない

### デプロイ時

1. **環境変数**: 機密情報をコードに含めない
2. **HTTPS**: すべての通信を暗号化
3. **定期的な更新**: セキュリティパッチを適用
4. **監視**: 不審な活動を検出
5. **バックアップ**: 定期的にバックアップ

### 運用時

1. **ログ監視**: 定期的にログを確認
2. **アクセス制限**: IP制限、VPNなど
3. **定期的な監査**: セキュリティ監査を実施
4. **インシデント対応計画**: 事前に計画を準備
5. **教育**: チーム全体でセキュリティ意識を向上

---

## ✅ セキュリティ監査チェックリスト

### 月次チェック

- [ ] 依存関係の脆弱性スキャン
- [ ] アクセスログの確認
- [ ] エラーログの確認
- [ ] バックアップの確認
- [ ] SSL/TLS証明書の有効期限確認

### 四半期チェック

- [ ] ペネトレーションテスト
- [ ] コードレビュー（セキュリティ観点）
- [ ] アクセス権限の見直し
- [ ] インシデント対応計画の更新
- [ ] セキュリティトレーニング

### 年次チェック

- [ ] 包括的なセキュリティ監査
- [ ] ディザスタリカバリテスト
- [ ] コンプライアンスレビュー
- [ ] サードパーティセキュリティ評価
- [ ] セキュリティポリシーの更新

---

## 🔗 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

## 🆘 セキュリティ問題の報告

セキュリティ脆弱性を発見した場合は、公開せずに以下に報告してください：

📧 security@yourdomain.com

---

**セキュリティは継続的なプロセスです。定期的に監査を実施してください！🔒**



