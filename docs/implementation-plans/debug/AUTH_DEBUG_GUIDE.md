# 認証デバッグガイド

## 修正内容（2025-10-23 追加修正）

### 問題1: Invalid hook call エラー
**原因**: AuthProviderでuseEffectの中やレンダリング中に`useAuthStore((state) => state.error)`を呼び出していた

**修正**: すべてのhookをコンポーネントのトップレベルで呼び出すように変更
```typescript
// 修正前（エラー）
useEffect(() => {
  const error = useAuthStore((state) => state.error) // ❌ useEffectの中でhook呼び出し
  ...
}, [])

// 修正後（正常）
const error = useAuthError() // ✅ トップレベルでhook呼び出し
useEffect(() => {
  if (!error) return
  ...
}, [error])
```

### 問題2: ログアウト状態でもリダイレクトされない
**原因**: 複数の問題が重なっていた
1. `initialize()`メソッドが`isLoading`を適切に管理していなかった
2. レイアウトがローディング完了前にリダイレクトしていた
3. ミドルウェアのログがターミナルにしか表示されないため、動作確認が困難だった

**修正**:
1. `initialize()`メソッドで`isLoading`を適切に管理
2. レイアウトで`mounted`状態とローディング状態を両方チェック
3. ミドルウェアに詳細なログを追加

## デバッグ手順

### 1. 準備

シークレットモードまたは新しいブラウザプロファイルで以下を実行：

```bash
# ターミナル1: バックエンド
cd /Users/shindokosuke/Qupid
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ターミナル2: フロントエンド（このターミナルでミドルウェアログを確認）
cd /Users/shindokosuke/Qupid/frontend
npm run dev
```

### 2. 未認証状態でのテスト

#### ステップ1: LocalStorageとCookieのクリア
1. ブラウザの開発者ツールを開く（F12）
2. Application > Storage > Clear site data をクリック
3. または手動で：
   - Cookies: `auth-token` を削除
   - Local Storage: `auth-storage` を削除

#### ステップ2: 保護ページへの直接アクセス
1. `http://localhost:3000/home` に直接アクセス
2. **ブラウザのコンソール**で以下のログを確認：
   ```
   [AuthProvider] Initializing...
   [Auth] Initializing auth state...
   [Auth] No valid authentication found
   [AuthProvider] Initialization complete
   DashboardLayout: waiting for initialization...
   DashboardLayout: checking auth state
   DashboardLayout: not authenticated, redirecting to login
   ```

3. **フロントエンドのターミナル**で以下のミドルウェアログを確認：
   ```
   [Middleware] Request to: /home
   [Middleware] Auth status: not authenticated
   [Middleware] Protected route detected: /home
   [Middleware] Not authenticated, redirecting to login
   [Middleware] Request to: /auth/login
   [Middleware] Auth route detected: /auth/login
   [Middleware] Not authenticated, allowing access to auth page
   ```

4. `/auth/login` にリダイレクトされることを確認

#### ステップ3: 他の保護ページのテスト
以下のURLで同様のテストを実行：
- `http://localhost:3000/profile`
- `http://localhost:3000/matches`
- `http://localhost:3000/chat`
- `http://localhost:3000/settings`

すべて `/auth/login` にリダイレクトされるはずです。

### 3. 認証後のテスト

#### ステップ1: ログイン
1. `/auth/login` または `/email-login` でログイン
2. コンソールで以下を確認：
   ```
   [Auth] Login successful: { userId: 1, hasToken: true }
   [Auth] Token saved to cookie
   [Auth] Token saved to localStorage
   ```

#### ステップ2: ページリロード
1. F5でページをリロード
2. コンソールで以下を確認：
   ```
   [Auth] Rehydrating from localStorage...
   [Auth] Rehydrated successfully, restoring cookie
   [AuthProvider] Initializing...
   [Auth] Initializing auth state...
   [Auth] User data refreshed: 1
   [AuthProvider] Initialization complete
   ```

#### ステップ3: 認証ページへのアクセス
1. ログイン状態で `/auth/login` にアクセス
2. ミドルウェアログで以下を確認（ターミナル）：
   ```
   [Middleware] Request to: /auth/login
   [Middleware] Auth status: authenticated
   [Middleware] Auth route detected: /auth/login
   [Middleware] Already authenticated, redirecting to home
   ```
3. `/home` にリダイレクトされることを確認

### 4. ログアウトのテスト

#### ステップ1: ログアウト実行
1. ログイン状態でログアウトボタンをクリック
2. コンソールで以下を確認：
   ```
   [Auth] Logging out...
   [Auth] Tokens and storage cleared
   ```

#### ステップ2: 状態確認
1. `/debug-auth` にアクセス
2. 以下を確認：
   - isAuthenticated: false
   - user: null
   - tokens: null
   - Cookie: auth-token なし
   - LocalStorage: auth-storage なし

#### ステップ3: リダイレクト確認
1. ログアウト後、`/home` にアクセス
2. `/auth/login` にリダイレクトされることを確認

## トラブルシューティング

### 問題: ミドルウェアログが見えない

**解決方法**: Next.jsのミドルウェアはサーバーサイドで実行されるため、ブラウザではなく**フロントエンドの開発サーバーを実行しているターミナル**にログが表示されます。

### 問題: リダイレクトがループする

**原因**: 
1. Cookieとストアの状態が不一致
2. `initialize()`が無限ループに入っている

**解決方法**:
1. ブラウザの開発者ツールでLocalStorageとCookieを完全にクリア
2. ページをリロード
3. コンソールログで`initialize()`が1回だけ呼ばれることを確認

### 問題: ログイン後もリダイレクトされる

**原因**: トークンが正しく保存されていない

**確認方法**:
1. ログイン後、開発者ツールのApplicationタブを開く
2. Cookies > localhost:3000 > `auth-token` が存在するか確認
3. Local Storage > `auth-storage` が存在するか確認
4. コンソールで `[Auth] Token saved to cookie` ログを確認

**解決方法**:
- Cookieが保存されていない場合：ブラウザのCookie設定を確認
- LocalStorageが保存されていない場合：プライベートモードやシークレットモードを確認

### 問題: ページリロード後にログアウトされる

**原因**: 
1. トークンの有効期限切れ
2. rehydration（復元）の失敗

**確認方法**:
1. コンソールで rehydration ログを確認：
   ```
   [Auth] Rehydrating from localStorage...
   [Auth] Token expired during rehydration, clearing state
   ```
   または
   ```
   [Auth] Rehydrated successfully, restoring cookie
   ```

**解決方法**:
- トークン期限切れの場合：再ログイン
- 復元失敗の場合：LocalStorageとCookieをクリアして再ログイン

## ログの読み方

### ブラウザコンソールのログプレフィックス

- `[Auth]` - Zustandストアの認証関連アクション
- `[AuthProvider]` - AuthProviderコンポーネントの初期化
- `[InitialProfile]` - 初回プロフィール登録
- `LoginForm:` - ログインフォーム
- `DashboardLayout:` - ダッシュボードレイアウト
- `AuthLayout:` - 認証レイアウト

### ターミナル（フロントエンド開発サーバー）のログプレフィックス

- `[Middleware]` - Next.jsミドルウェア（サーバーサイド）

### バックエンドターミナルのログ

- `INFO:` - 一般的な情報
- `WARNING:` - 警告
- `ERROR:` - エラー

## 期待される動作フロー

### 未認証ユーザーが /home にアクセス

1. **ミドルウェア**（ターミナル）:
   ```
   [Middleware] Request to: /home
   [Middleware] Auth status: not authenticated
   [Middleware] Protected route detected: /home
   [Middleware] Not authenticated, redirecting to login
   ```

2. **クライアント**（ブラウザコンソール）:
   ```
   [AuthProvider] Initializing...
   [Auth] Initializing auth state...
   [Auth] No valid authentication found
   [AuthProvider] Initialization complete
   DashboardLayout: checking auth state { isAuthenticated: false, user: null }
   DashboardLayout: not authenticated, redirecting to login
   ```

3. **結果**: `/auth/login?redirect=/home` にリダイレクト

### 認証済みユーザーが /auth/login にアクセス

1. **ミドルウェア**（ターミナル）:
   ```
   [Middleware] Request to: /auth/login
   [Middleware] Auth status: authenticated
   [Middleware] Auth route detected: /auth/login
   [Middleware] Already authenticated, redirecting to home
   ```

2. **クライアント**（ブラウザコンソール）:
   ```
   [AuthProvider] Initializing...
   [Auth] Initializing auth state...
   [Auth] User data refreshed: 1
   [AuthProvider] Initialization complete
   AuthLayout: checking auth state { isAuthenticated: true }
   AuthLayout: user is authenticated, redirecting to home
   ```

3. **結果**: `/home` にリダイレクト

## 修正ファイル一覧

1. `/Users/shindokosuke/Qupid/frontend/src/components/providers/AuthProvider.tsx`
   - hookの呼び出しをトップレベルに移動
   - useEffect依存配列を修正

2. `/Users/shindokosuke/Qupid/frontend/src/stores/auth.ts`
   - `initialize()`メソッドで`isLoading`を適切に管理
   - `logout()`メソッドで状態を適切にクリア

3. `/Users/shindokosuke/Qupid/frontend/src/app/(dashboard)/layout.tsx`
   - `mounted`状態を追加
   - ローディング完了後のみリダイレクト

4. `/Users/shindokosuke/Qupid/frontend/src/app/(auth)/layout.tsx`
   - `mounted`状態を追加
   - ローディング完了後のみリダイレクト

5. `/Users/shindokosuke/Qupid/frontend/src/middleware/auth.ts`
   - 詳細なデバッグログを追加

---

**作成日**: 2025-10-23
**最終更新**: 2025-10-23


