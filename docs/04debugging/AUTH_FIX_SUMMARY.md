# 認証機能修正サマリー

## 修正日時
2025-10-23

## 報告された問題

### 1. Invalid hook call エラー
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```
シークレットモードでアクセスすると、AuthProvider.tsx:42でエラーが発生。

### 2. リダイレクトが機能しない
ログアウト状態のまま他のページ（/home, /profile など）にアクセスしても、ログインページにリダイレクトされない。

## 根本原因

### 原因1: Reactのルール違反
`AuthProvider.tsx`で以下の2箇所でhookのルールに違反：

1. **42行目**: useEffect内でuseAuthStoreを呼び出し
   ```typescript
   useEffect(() => {
     const error = useAuthStore((state) => state.error) // ❌ NG
     ...
   }, [clearError])
   ```

2. **54-55行目**: レンダリング中にuseAuthStoreを呼び出し
   ```typescript
   const contextValue: AuthContextType = {
     isAuthenticated,
     isLoading: !initialized || useAuthStore((state) => state.isLoading), // ❌ NG
     error: useAuthStore((state) => state.error), // ❌ NG
   }
   ```

### 原因2: 初期化フローの問題
1. `initialize()`メソッドが`isLoading`状態を管理していなかった
2. 未認証の場合でも`isLoading`がtrueのまま残っていた
3. レイアウトが初期化完了を待たずにリダイレクトを試みていた

### 原因3: SSR/CSRのハイドレーション問題
1. サーバーサイドとクライアントサイドで状態が異なる
2. `mounted`状態を追跡していなかった

## 実施した修正

### 修正1: AuthProvider.tsx
**変更前**:
```typescript
useEffect(() => {
  const error = useAuthStore((state) => state.error)
  if (!error) return
  ...
}, [clearError])

const contextValue: AuthContextType = {
  isAuthenticated,
  isLoading: !initialized || useAuthStore((state) => state.isLoading),
  error: useAuthStore((state) => state.error),
}
```

**変更後**:
```typescript
// トップレベルでhookを呼び出し
const error = useAuthError()
const isLoading = useAuthLoading()

useEffect(() => {
  if (!error) return
  ...
}, [error, clearError])

const contextValue: AuthContextType = {
  isAuthenticated,
  isLoading: !initialized || isLoading,
  error,
}
```

### 修正2: auth.ts (Zustandストア)

**initialize()メソッド**:
```typescript
// 変更前
initialize: async () => {
  console.log('[Auth] Initializing auth state...')
  const state = get()
  // isLoadingの管理なし
  ...
}

// 変更後
initialize: async () => {
  console.log('[Auth] Initializing auth state...')
  set({ isLoading: true }) // ✅ ローディング開始
  
  try {
    const state = get()
    if (state.isAuthenticated && state.tokens) {
      // トークン検証...
      set({ user, isLoading: false }) // ✅ 成功時
    } else {
      console.log('[Auth] No valid authentication found')
      set({ isLoading: false }) // ✅ 未認証時も終了
    }
  } catch (error) {
    console.error('[Auth] Initialization error:', error)
    set({ isLoading: false }) // ✅ エラー時も終了
  }
}
```

### 修正3: DashboardLayout.tsx

**変更前**:
```typescript
const isAuthenticated = useIsAuthenticated()

useEffect(() => {
  if (!isAuthenticated) {
    router.push('/auth/login') // ⚠️ 初期化前に実行される可能性
  }
}, [isAuthenticated, router])
```

**変更後**:
```typescript
const isAuthenticated = useIsAuthenticated()
const isLoading = useAuthLoading()
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

useEffect(() => {
  if (!mounted || isLoading) return // ✅ ローディング完了を待つ
  
  if (!isAuthenticated) {
    router.push('/auth/login')
  }
}, [mounted, isLoading, isAuthenticated, router])

// ローディング中は読み込み画面を表示
if (!mounted || isLoading) {
  return <LoadingScreen />
}
```

### 修正4: AuthLayout.tsx
DashboardLayoutと同様の修正を適用。

### 修正5: auth.ts (middleware)
詳細なデバッグログを追加：
```typescript
console.log(`[Middleware] Request to: ${pathname}`)
console.log(`[Middleware] Auth status: ${isAuthenticated ? 'authenticated' : 'not authenticated'}`)
console.log(`[Middleware] Protected route detected: ${pathname}`)
// など
```

## 修正後の動作フロー

### シナリオ1: 未認証ユーザーが /home にアクセス

1. **ミドルウェア（サーバーサイド）**
   - Cookieに`auth-token`がないことを確認
   - `/auth/login?redirect=/home`にリダイレクト

2. **クライアントサイド（初期化）**
   - AuthProviderが`initialize()`を呼び出し
   - `isLoading: true`に設定
   - LocalStorageを確認（認証情報なし）
   - `isLoading: false`に設定

3. **クライアントサイド（レイアウト）**
   - DashboardLayoutが`mounted`と`isLoading`をチェック
   - 両方がfalse/trueになるまで待機
   - `isAuthenticated`がfalseであることを確認
   - `/auth/login`にリダイレクト

### シナリオ2: 認証済みユーザーが /auth/login にアクセス

1. **ミドルウェア（サーバーサイド）**
   - Cookieに`auth-token`が存在
   - `/home`にリダイレクト

2. **クライアントサイド（初期化）**
   - AuthProviderが`initialize()`を呼び出し
   - LocalStorageから認証情報を復元
   - トークンの有効期限をチェック
   - `/users/me`APIでユーザー情報を取得
   - Cookieを更新

3. **クライアントサイド（レイアウト）**
   - AuthLayoutが`isAuthenticated`がtrueであることを確認
   - `/home`にリダイレクト

## テスト方法

### 基本テスト

```bash
# 1. シークレットモードでブラウザを開く

# 2. http://localhost:3000/home にアクセス
# 期待結果: /auth/login にリダイレクトされる

# 3. ブラウザのコンソールで以下のログを確認
[AuthProvider] Initializing...
[Auth] Initializing auth state...
[Auth] No valid authentication found
[AuthProvider] Initialization complete
DashboardLayout: checking auth state { isAuthenticated: false, user: null }
DashboardLayout: not authenticated, redirecting to login

# 4. フロントエンドのターミナルで以下のログを確認
[Middleware] Request to: /home
[Middleware] Auth status: not authenticated
[Middleware] Protected route detected: /home
[Middleware] Not authenticated, redirecting to login
```

詳細なテスト手順は`AUTH_DEBUG_GUIDE.md`を参照。

## 影響範囲

### 修正ファイル
1. `frontend/src/components/providers/AuthProvider.tsx` - Hookルール違反の修正
2. `frontend/src/stores/auth.ts` - 初期化フローの修正
3. `frontend/src/app/(dashboard)/layout.tsx` - ローディング状態の追跡
4. `frontend/src/app/(auth)/layout.tsx` - ローディング状態の追跡
5. `frontend/src/middleware/auth.ts` - デバッグログの追加

### 影響を受けるページ
- すべての保護ページ（/home, /profile, /matches, /chat, /settings など）
- すべての認証ページ（/auth/login, /auth/register, /email-login など）
- 初回プロフィール登録ページ（/initial-profile）

### 破壊的変更
なし。既存のAPIやデータ構造は変更されていません。

## 今後の推奨事項

### 1. E2Eテストの追加
Playwrightなどを使用して、以下のシナリオの自動テストを作成：
- 未認証状態での保護ページへのアクセス
- ログイン後の認証ページへのアクセス
- ページリロード後の認証状態の保持
- ログアウト後のリダイレクト

### 2. エラーハンドリングの改善
- ネットワークエラー時の適切なフォールバック
- トークン期限切れ時の自動リフレッシュ
- より詳細なエラーメッセージ

### 3. パフォーマンス最適化
- トークンリフレッシュの実装
- オフライン対応
- ローディング状態のスケルトンUI

### 4. セキュリティ強化
- CSRFトークンの実装
- XSS対策の強化
- セキュリティヘッダーの追加

## 検証済み環境

- **OS**: macOS 14.6.0 (darwin 24.6.0)
- **Node.js**: v18+（package.jsonから推測）
- **ブラウザ**: Chrome（シークレットモード）
- **バックエンド**: Python 3.13 + FastAPI + uvicorn
- **フロントエンド**: Next.js 15 + React + TypeScript

## 関連ドキュメント

- `AUTH_TEST_GUIDE.md` - 基本的なテストガイド
- `AUTH_DEBUG_GUIDE.md` - 詳細なデバッグガイド
- `docs/implementation-plans/frontend/02-auth-profile.md` - 実装計画書

---

**修正担当**: AI Assistant
**レビュー**: 必要
**承認**: 保留中


