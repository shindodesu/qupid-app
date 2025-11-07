# ミドルウェア更新: 全ページ認証必須化

## 更新日時
2025-10-23

## 変更内容

### 変更前の動作
- 保護ページ（/home, /profile など）のみ認証が必要
- パブリックページ（/, /about, /contact, /privacy, /terms, /debug-auth）は誰でもアクセス可能

### 変更後の動作
- **ログアウト状態では全てのページが `/auth/login` にリダイレクト**
- 例外は認証関連ページのみ：
  - `/auth/login` - ログインページ
  - `/auth/register` - 新規登録ページ
  - `/auth/forgot-password` - パスワード忘れページ
  - `/email-login` - メール認証ページ

## 変更したファイル

`/Users/shindokosuke/Qupid/frontend/src/middleware/auth.ts`

## 変更の詳細

### 削除した定数

```typescript
// 削除: 保護ルートのリスト（不要になった）
const PROTECTED_ROUTES = [...]

// 削除: パブリックページのリスト（全て認証必須に）
const PUBLIC_ROUTES = [...]
```

### 新しいロジック

```typescript
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. 静的リソース（画像、マニフェストなど）はスキップ
  if (PUBLIC_RESOURCES.includes(pathname)) {
    return NextResponse.next()
  }
  
  const isAuthenticated = !!request.cookies.get('auth-token')?.value
  
  // 2. 認証ページへのアクセス
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // 認証済みユーザーは /home にリダイレクト
      return NextResponse.redirect(new URL('/home', request.url))
    }
    // 未認証ユーザーは認証ページにアクセス可能
    return NextResponse.next()
  }
  
  // 3. 未認証の場合は全てログインページにリダイレクト
  if (!isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 4. 認証済みの場合は全てのページにアクセス可能
  return NextResponse.next()
}
```

## アクセス可能なページ

### 未認証ユーザー（ログアウト状態）

**アクセス可能**:
- ✅ `/auth/login` - ログインページ
- ✅ `/auth/register` - 新規登録ページ
- ✅ `/auth/forgot-password` - パスワード忘れページ
- ✅ `/email-login` - メール認証ページ

**リダイレクト**（全て `/auth/login?redirect=[元のURL]` に移動）:
- ❌ `/` - ルートページ
- ❌ `/home` - ホームページ
- ❌ `/profile` - プロフィールページ
- ❌ `/matches` - マッチページ
- ❌ `/chat` - チャットページ
- ❌ `/settings` - 設定ページ
- ❌ `/privacy` - プライバシーポリシー
- ❌ `/terms` - 利用規約
- ❌ `/about` - About ページ
- ❌ `/debug-auth` - デバッグページ
- ❌ その他すべてのページ

### 認証済みユーザー（ログイン状態）

**アクセス可能**:
- ✅ すべてのページにアクセス可能

**リダイレクト**:
- `/auth/login` にアクセス → `/home` にリダイレクト
- `/auth/register` にアクセス → `/home` にリダイレクト
- `/email-login` にアクセス → `/home` にリダイレクト

## テストシナリオ

### シナリオ1: 未認証でルートページにアクセス

```
アクセス: http://localhost:3000/
期待結果: http://localhost:3000/auth/login?redirect=/ にリダイレクト
```

**ログ（ターミナル）**:
```
[Middleware] Request to: /
[Middleware] Auth status: not authenticated
[Middleware] Not authenticated, redirecting to login: /
```

### シナリオ2: 未認証で /home にアクセス

```
アクセス: http://localhost:3000/home
期待結果: http://localhost:3000/auth/login?redirect=/home にリダイレクト
```

**ログ（ターミナル）**:
```
[Middleware] Request to: /home
[Middleware] Auth status: not authenticated
[Middleware] Not authenticated, redirecting to login: /home
```

### シナリオ3: 未認証で /privacy にアクセス

```
アクセス: http://localhost:3000/privacy
期待結果: http://localhost:3000/auth/login?redirect=/privacy にリダイレクト
```

**ログ（ターミナル）**:
```
[Middleware] Request to: /privacy
[Middleware] Auth status: not authenticated
[Middleware] Not authenticated, redirecting to login: /privacy
```

### シナリオ4: 認証済みで /auth/login にアクセス

```
アクセス: http://localhost:3000/auth/login
期待結果: http://localhost:3000/home にリダイレクト
```

**ログ（ターミナル）**:
```
[Middleware] Request to: /auth/login
[Middleware] Auth status: authenticated
[Middleware] Auth route detected: /auth/login
[Middleware] Already authenticated, redirecting to home
```

### シナリオ5: 認証済みで /home にアクセス

```
アクセス: http://localhost:3000/home
期待結果: 正常にページが表示される
```

**ログ（ターミナル）**:
```
[Middleware] Request to: /home
[Middleware] Auth status: authenticated
[Middleware] Authenticated, allowing access: /home
```

## テスト手順

### 準備
1. ブラウザのキャッシュとCookieをクリア
2. 新しいシークレットウィンドウを開く

### テスト1: 未認証状態で各種ページにアクセス

```bash
# 以下のURLに順番にアクセス
http://localhost:3000/
http://localhost:3000/home
http://localhost:3000/profile
http://localhost:3000/privacy
http://localhost:3000/terms

# 期待結果: すべて /auth/login にリダイレクトされる
```

### テスト2: ログイン

```bash
# ログインページでログイン
http://localhost:3000/auth/login

# またはメール認証
http://localhost:3000/email-login
```

### テスト3: 認証済み状態で各種ページにアクセス

```bash
# 以下のURLに順番にアクセス
http://localhost:3000/home
http://localhost:3000/profile
http://localhost:3000/privacy
http://localhost:3000/terms

# 期待結果: すべて正常に表示される
```

### テスト4: 認証済み状態でログインページにアクセス

```bash
http://localhost:3000/auth/login

# 期待結果: /home にリダイレクトされる
```

## リダイレクト後の動作

ログインページにリダイレクトされる際、元のURLが `redirect` パラメータとして保存されます：

```
/home にアクセス → /auth/login?redirect=/home にリダイレクト
```

ログイン成功後、この `redirect` パラメータを使用して元のページに戻ることができます（実装推奨）。

## ログの確認方法

### ブラウザコンソール
クライアントサイドのログ（`[Auth]`, `[AuthProvider]`, `DashboardLayout:` など）

### フロントエンドのターミナル
ミドルウェアのログ（`[Middleware]`）を確認

## 影響範囲

### 影響を受けるページ
- **全てのページ**（静的リソースと認証ページを除く）

### 破壊的変更
- ❌ **破壊的**: 以前はパブリックだったページ（/, /privacy, /terms など）が認証必須に
- ✅ **推奨**: マッチングアプリの性質上、認証なしでアクセスできるページは最小限にすべき

### ユーザー体験への影響
- ✅ **改善**: セキュリティが向上
- ✅ **改善**: 全てのページで一貫した認証体験
- ⚠️ **注意**: プライバシーポリシーや利用規約もログイン後のみアクセス可能
  - 登録時に必要な場合は、認証ページ内でモーダル表示を推奨

## 今後の検討事項

### 1. 利用規約・プライバシーポリシーの表示方法

**現状**: ログイン後のみアクセス可能

**推奨される実装**:
- オプションA: 登録ページ内でモーダル表示
- オプションB: `/auth/terms` と `/auth/privacy` を作成（AUTH_ROUTESに追加）
- オプションC: APIで内容を取得してモーダル表示

**実装例（オプションB）**:
```typescript
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/terms',      // 追加
  '/auth/privacy',    // 追加
  '/email-login',
]
```

### 2. ランディングページの追加

マーケティング用のランディングページが必要な場合：
- `/landing` ページを作成
- AUTH_ROUTESに追加
- ルートページ `/` をランディングページにリダイレクト

## 関連ドキュメント

- `AUTH_TEST_GUIDE.md` - 認証機能のテストガイド
- `AUTH_DEBUG_GUIDE.md` - 認証のデバッグガイド
- `URGENT_FIX.md` - 直近の修正内容

---

**更新担当**: AI Assistant
**優先度**: 🟢 通常
**ステータス**: ✅ 完了
**テスト**: ⏳ 検証待ち


