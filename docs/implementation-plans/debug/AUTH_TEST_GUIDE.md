# 認証機能テストガイド

## 実装完了内容

### 1. Zustandストアの完全再実装
- シンプルで確実な状態管理に変更
- トークンの永続化（localStorage + Cookie）
- 初期化時の自動認証状態復元
- トークンの有効期限チェック

### 2. 認証フローの修正
- ログイン・登録機能の実装
- メール認証システムの統合
- 初回プロフィール登録フローの実装

### 3. ミドルウェアとガードの修正
- Next.js middlewareによる保護ルートのチェック
- 認証済みユーザーの適切なリダイレクト
- 未認証ユーザーのログインページへのリダイレクト

### 4. トークン管理の実装
- Cookieへのトークン保存（ミドルウェア用）
- LocalStorageへのトークン保存（クライアント用）
- ページリロード時の認証状態復元

## テスト手順

### 準備
1. バックエンドサーバーが起動していることを確認
   ```bash
   cd /Users/shindokosuke/Qupid
   source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. フロントエンドサーバーが起動していることを確認
   ```bash
   cd /Users/shindokosuke/Qupid/frontend
   npm run dev
   ```

### テスト1: ログイン機能

1. ブラウザで `http://localhost:3000/auth/login` にアクセス
2. メールアドレスとパスワードを入力してログイン
3. ログイン成功後、以下を確認：
   - プロフィール未完了の場合：`/initial-profile` にリダイレクト
   - プロフィール完了済みの場合：`/home` にリダイレクト
   - ブラウザのCookieに `auth-token` が保存されている
   - LocalStorageに `auth-storage` が保存されている

### テスト2: メール認証（推奨）

1. ブラウザで `http://localhost:3000/email-login` にアクセス
2. 九州大学のメールアドレスを入力（例: `test@s.kyushu-u.ac.jp`）
3. 認証コード送信後、以下の方法でコードを確認：
   - **開発環境**: ブラウザのコンソールまたはバックエンドのターミナルに表示
   - **本番環境**: メールに送信される

4. 認証コードツールを使用（開発環境のみ）：
   ```bash
   cd /Users/shindokosuke/Qupid
   python3 dev_tools/get_latest_verification_code.py
   ```

5. 認証コードを入力して確認
6. 以下を確認：
   - 新規ユーザー：「アカウントを作成しました」のメッセージ → `/initial-profile` にリダイレクト
   - 既存ユーザー（プロフィール未完了）：`/initial-profile` にリダイレクト
   - 既存ユーザー（プロフィール完了）：`/home` にリダイレクト

### テスト3: 初回プロフィール登録

1. 新規ユーザーでログイン後、自動的に `/initial-profile` にリダイレクトされる
2. 以下の情報を入力：
   - ニックネーム
   - 生年月日
   - 性別
   - セクシュアリティ
   - 探している関係
   - プロフィール画像（オプション）

3. 「Confirm」ボタンをクリック
4. プロフィール登録成功後、`/home` にリダイレクトされる

### テスト4: 認証状態の永続化

1. ログイン後、ページをリロード（F5）
2. 以下を確認：
   - ログイン状態が保持されている
   - `/home` や他の保護ページにアクセスできる
   - ログインページにリダイレクトされない

3. ブラウザを閉じて再度開く
4. `http://localhost:3000/home` にアクセス
5. ログイン状態が保持されていることを確認

### テスト5: 保護ルートのチェック

1. **未認証状態でのテスト**：
   - ブラウザのLocalStorageとCookieをクリア
   - 保護ルート（`/home`, `/profile`, `/matches` など）にアクセス
   - `/auth/login` にリダイレクトされることを確認

2. **認証済み状態でのテスト**：
   - ログイン後、`/auth/login` や `/auth/register` にアクセス
   - `/home` にリダイレクトされることを確認

### テスト6: ログアウト

1. ログイン後、プロフィールページまたはナビゲーションからログアウト
2. 以下を確認：
   - ログアウト後、`/auth/login` にリダイレクトされる
   - LocalStorageとCookieから認証情報がクリアされる
   - 保護ページにアクセスできない

## デバッグ

### 認証状態の確認

`http://localhost:3000/debug-auth` にアクセスして、以下を確認：
- Zustandストアの状態
- Cookie情報
- LocalStorage情報

### 認証情報のクリア

デバッグページから「認証情報をクリア」ボタンをクリックして、すべての認証情報を削除できます。

### コンソールログ

ブラウザの開発者ツールのコンソールで、以下のログを確認：
- `[Auth]` プレフィックス：Zustandストアのアクション
- `[AuthProvider]` プレフィックス：認証プロバイダーの初期化
- `[InitialProfile]` プレフィックス：初回プロフィール登録
- `LoginForm:` プレフィックス：ログインフォーム
- `DashboardLayout:` プレフィックス：ダッシュボードレイアウト
- `AuthLayout:` プレフィックス：認証レイアウト

## トラブルシューティング

### 問題: ログイン後にリダイレクトされない

**解決方法**：
1. ブラウザのコンソールでエラーを確認
2. LocalStorageとCookieに認証情報が保存されているか確認
3. `/debug-auth` ページで認証状態を確認
4. バックエンドのログでAPIエラーを確認

### 問題: ページリロード後にログアウトされる

**解決方法**：
1. LocalStorageに `auth-storage` が保存されているか確認
2. Cookieに `auth-token` が保存されているか確認
3. トークンの有効期限が切れていないか確認
4. ブラウザのコンソールで `[Auth] Rehydrating from localStorage...` ログを確認

### 問題: 認証コードが見つからない（開発環境）

**解決方法**：
1. バックエンドのターミナルで認証コードを確認
2. 開発ツールを使用：
   ```bash
   python3 dev_tools/get_latest_verification_code.py
   ```
3. データベースを直接確認：
   ```bash
   sqlite3 qupid.db "SELECT id, email, verification_code, datetime(expires_at, 'localtime') FROM email_verifications ORDER BY id DESC LIMIT 5;"
   ```

## 実装の詳細

### Zustandストアの構造

```typescript
interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // アクション
  login: (credentials) => Promise<void>
  register: (credentials) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  updateUser: (userData) => void
  setUser: (user) => void
  setTokens: (tokens) => void
  setAuthenticated: (isAuthenticated) => void
  clearError: () => void
  setLoading: (loading) => void
}
```

### 認証フロー

1. **ログイン/登録**
   - ユーザーがフォームを送信
   - Zustandストアの `login()` または `register()` を呼び出し
   - バックエンドAPIに認証リクエスト
   - 成功時：トークンとユーザー情報を保存（LocalStorage + Cookie）
   - 失敗時：エラーメッセージを表示

2. **初期化（ページロード時）**
   - AuthProviderが `initialize()` を呼び出し
   - LocalStorageから認証情報を復元
   - トークンの有効期限をチェック
   - 有効な場合：`/users/me` APIでユーザー情報を取得
   - 無効な場合：ログアウト

3. **ミドルウェアチェック**
   - リクエストごとにCookieから `auth-token` をチェック
   - 保護ルート：トークンがない場合 → `/auth/login` にリダイレクト
   - 認証ページ：トークンがある場合 → `/home` にリダイレクト

## 次のステップ

1. **E2Eテストの実装**
   - Playwright または Cypress を使用
   - 認証フロー全体の自動テスト

2. **エラーハンドリングの改善**
   - より詳細なエラーメッセージ
   - ユーザーフレンドリーなエラー表示

3. **パフォーマンス最適化**
   - トークンのリフレッシュ機能
   - オフライン対応

---

**作成日**: 2025-10-23
**最終更新**: 2025-10-23


