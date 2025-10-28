# Qupid ハイブリッド認証システム

**作成日**: 2025-10-28  
**認証方式**: メール認証コード + パスワード

---

## 📊 概要

Qupidは**ハイブリッド認証システム**を採用しています。これは、セキュリティとユーザビリティの両方を最大化するために設計されました。

### 認証方式の組み合わせ

1. **初回登録**: メール認証コード → パスワード設定
2. **ログイン**: パスワード認証のみ
3. **パスワード忘れた**: メール認証コード → パスワードリセット

---

## 🔐 認証フロー

### 1. 新規登録フロー

```
ユーザー
  ↓
[/auth/register] - 利用規約に同意
  ↓
[/email-login] - メールアドレス入力
  ↓
POST /auth/email/send-code
  ↓
メールアドレスに認証コード送信
  ↓
[/email-login] - 認証コード入力（6桁）
  ↓
POST /auth/email/verify-code (パスワードなし)
  ↓
requires_password: true を返す
  ↓
[/email-login] - パスワード設定ステップ
  ↓
POST /auth/email/verify-code (パスワードあり)
  ↓
ユーザー作成 + トークン発行
  ↓
[/initial-profile] - プロフィール設定
  ↓
[/home] - ホーム画面
```

### 2. ログインフロー（既存ユーザー）

```
ユーザー
  ↓
[/auth/login] - メール + パスワード入力
  ↓
POST /auth/login
  ↓
パスワード検証
  ↓
トークン発行
  ↓
[/home] - ホーム画面
```

### 3. パスワードリセットフロー

```
ユーザー
  ↓
[/auth/forgot-password] - メールアドレス入力
  ↓
POST /auth/email/send-code
  ↓
メールアドレスに認証コード送信
  ↓
[/auth/forgot-password] - 認証コード入力
  ↓
[/auth/forgot-password] - 新しいパスワード設定
  ↓
POST /auth/email/reset-password
  ↓
パスワード更新
  ↓
[/auth/login] - ログイン画面
```

---

## 🔧 技術実装

### バックエンド（FastAPI）

#### エンドポイント一覧

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/auth/register` | POST | パスワード認証による新規登録 |
| `/auth/login` | POST | パスワード認証によるログイン |
| `/auth/email/send-code` | POST | 認証コード送信 |
| `/auth/email/verify-code` | POST | 認証コード検証 + ログイン/登録 |
| `/auth/email/resend-code` | POST | 認証コード再送信 |
| `/auth/email/reset-password` | POST | パスワードリセット |

#### セキュリティ対策

1. **パスワードハッシュ化**: bcrypt + passlib
2. **JWT認証**: HS256アルゴリズム
3. **メールドメイン検証**: `@s.kyushu-u.ac.jp` 限定
4. **認証コード有効期限**: 10分間
5. **パスワード強度**: 最低8文字

#### データベーススキーマ

```python
class User(Base):
    id: int
    email: str  # ユニーク、@s.kyushu-u.ac.jp のみ
    hashed_password: str  # bcryptハッシュ
    display_name: str
    profile_completed: bool
    # ... その他のフィールド

class EmailVerification(Base):
    id: int
    email: str
    verification_code: str  # 6桁
    is_verified: bool
    expires_at: datetime
    user_id: int | None  # ユーザー紐付け
```

### フロントエンド（Next.js）

#### ページ構成

| ルート | 説明 |
|--------|------|
| `/auth/register` | 新規登録入口（→ /email-login） |
| `/auth/login` | パスワードログイン |
| `/email-login` | メール認証フロー（3ステップ） |
| `/auth/forgot-password` | パスワードリセット（3ステップ） |
| `/initial-profile` | 初回プロフィール設定 |

#### ステート管理（Zustand）

```typescript
interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  
  login: (credentials) => Promise<void>
  register: (credentials) => Promise<void>
  logout: () => Promise<void>
}
```

---

## 🎯 設計上の利点

### 1. セキュリティ

- ✅ パスワードによる強固な認証
- ✅ メール認証による本人確認
- ✅ 九州大学メール限定でなりすまし防止

### 2. ユーザビリティ

- ✅ 初回登録は簡単（メール認証 + パスワード設定のみ）
- ✅ ログインは高速（パスワードのみ）
- ✅ パスワード忘れても簡単にリセット可能

### 3. 拡張性

- ✅ 既存の `/auth/login`, `/auth/register` は保持（通常のパスワード認証）
- ✅ メール認証フローも保持（既存ユーザーの再ログイン）
- ✅ 2つの認証方式が共存

---

## 🔄 既存システムからの移行

### 移行前（旧システム）

- ❌ パスワード認証なし
- ❌ メール認証コードのみでログイン
- ❌ セキュリティリスク

### 移行後（新システム）

- ✅ パスワード認証あり
- ✅ メール認証 + パスワード設定
- ✅ 強固なセキュリティ

### 既存ユーザーへの影響

**既存のユーザー（パスワードが設定されていないユーザー）**:
- メール認証フロー (`/email-login`) を使用すると、既存ユーザーとして認識される
- パスワード設定ステップはスキップされる
- ログイン成功

**対策（推奨）**:
既存ユーザーに対して、初回ログイン時にパスワード設定を促すフローを追加することを推奨。

---

## 📝 開発環境での動作

### メール送信の無効化

開発環境では、メール送信を無効化し、認証コードをコンソールに出力します。

#### バックエンド設定（`.env`）

```env
ENABLE_EMAIL=false  # 開発環境ではfalse
APP_ENV=development
```

#### 認証コードの確認方法

1. **バックエンドターミナル**: 認証コード送信時にコンソールに出力
2. **ブラウザコンソール**: フロントエンドでもメッセージを表示
3. **データベース直接参照**: `email_verifications` テーブルを確認

```sql
SELECT email, verification_code, expires_at 
FROM email_verifications 
WHERE is_verified = false 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🧪 テスト方法

### 1. 新規登録テスト

```
1. /auth/register にアクセス
2. 利用規約に同意 → /email-login にリダイレクト
3. メールアドレスを入力（example@s.kyushu-u.ac.jp）
4. 認証コードを送信
5. コンソールで認証コードを確認
6. 認証コードを入力
7. パスワード設定画面が表示される
8. パスワードを設定（8文字以上）
9. アカウント作成成功
10. /initial-profile にリダイレクト
```

### 2. ログインテスト

```
1. /auth/login にアクセス
2. メールアドレスとパスワードを入力
3. ログインボタンをクリック
4. /home にリダイレクト
```

### 3. パスワードリセットテスト

```
1. /auth/login → "パスワードを忘れた方" をクリック
2. /auth/forgot-password にアクセス
3. メールアドレスを入力
4. 認証コードを送信
5. コンソールで認証コードを確認
6. 認証コードを入力
7. 新しいパスワードを設定
8. パスワードリセット成功
9. /auth/login にリダイレクト
```

---

## 🚨 トラブルシューティング

### Q1: 認証コードが届かない

**開発環境の場合**:
- バックエンドのターミナルを確認
- ブラウザのコンソールを確認
- データベースの `email_verifications` テーブルを確認

**本番環境の場合**:
- `.env` で `ENABLE_EMAIL=true` に設定されているか確認
- SMTP設定が正しいか確認
- メールの迷惑メールフォルダを確認

### Q2: パスワードが短すぎるエラー

パスワードは**8文字以上**必要です。

### Q3: 認証コードが期限切れ

認証コードの有効期限は**10分間**です。期限切れの場合は、「認証コードを再送信」ボタンをクリックしてください。

### Q4: ユーザーが既に存在するエラー

同じメールアドレスで既に登録済みの場合、`/auth/login` でログインしてください。

---

## 📦 デプロイメント

### 本番環境の設定

#### バックエンド（`.env`）

```env
# セキュリティ
SECRET_KEY=<長いランダム文字列>
APP_ENV=production

# メール送信
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=<Gmailアドレス>
SMTP_PASSWORD=<アプリパスワード>
FROM_EMAIL=noreply@qupid.com

# ドメイン制限
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp
```

#### フロントエンド（`.env.production`）

```env
NEXT_PUBLIC_API_URL=https://api.qupid.com
```

---

## 📊 統計情報

### 認証成功率（目標）

- 新規登録完了率: **90%以上**
- ログイン成功率: **95%以上**
- パスワードリセット成功率: **85%以上**

### パフォーマンス目標

- 認証コード送信時間: **< 3秒**
- ログイン処理時間: **< 1秒**
- パスワードリセット時間: **< 5秒**

---

## 🔮 将来の拡張

### フェーズ2（検討中）

1. **2要素認証（2FA）**: TOTPベースの2要素認証
2. **ソーシャルログイン**: Google, Apple Sign-in
3. **生体認証**: Touch ID, Face ID
4. **セッション管理**: アクティブセッション一覧、リモートログアウト

---

## 📞 お問い合わせ

認証システムに関する質問や問題がある場合は、Issueを作成してください。

---

**最終更新**: 2025-10-28  
**バージョン**: 2.0.0 (ハイブリッド認証システム)



