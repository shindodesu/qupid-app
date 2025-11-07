# Qupid プロジェクト - 包括的問題レポート

**作成日**: 2025-10-27  
**プロジェクト**: Qupid（九州大学LGBTQ+学生向けマッチングアプリ）  
**調査範囲**: バックエンド（FastAPI）+ フロントエンド（Next.js）

---

## 📊 プロジェクト状況概要

### 実装済み機能
✅ ユーザー認証（メール認証コード方式）  
✅ プロフィール管理  
✅ タグシステム  
✅ いいね・マッチング機能  
✅ ユーザー検索・フィルタリング  
✅ チャット機能（ポーリングベース）  
✅ 通報・ブロック機能  
✅ ファイルアップロード（アバター、音声メッセージ）  
✅ PWA対応  

### 未実装機能
❌ リアルタイム通信（WebSocket）  
❌ プッシュ通知  
❌ 自動テスト  
❌ CI/CDパイプライン  
❌ 監視・ログ収集システム  

---

## 🚨 重大な問題（優先度：高）

### 1. **セキュリティ: パスワード認証が存在しない**

**問題点**:
- `app/routers/auth.py` の `/auth/login` と `/auth/register` エンドポイントがパスワード検証を行っていない
- フロントエンドはパスワードフィールドを持っているが、バックエンドは受け取っても無視している
- Userモデルに `password` フィールドが存在しない

**現在のコード**:
```python
# app/routers/auth.py
@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """ログイン（既存ユーザーのみ、MVPではパスワード検証なし）"""
    # パスワード検証が一切ない！
```

```python
# app/schemas/auth.py
class LoginRequest(BaseModel):
    email: EmailStr
    password: str | None = None  # 受け取るが検証されない
```

**影響**:
- 🔴 **極めて深刻**: 誰でもメールアドレスさえ知っていればログインできる
- ユーザーのプライバシーとセキュリティが全く保護されていない

**解決策**:
1. Userモデルに `hashed_password` フィールドを追加
2. `passlib` と `bcrypt` を使用してパスワードをハッシュ化
3. ログイン時にパスワード検証を実装
4. Alembicマイグレーションでスキーマ更新

**修正優先度**: 🔴 **最優先**

---

### 2. **認証システムの混在**

**問題点**:
- `/auth/login` (パスワードなし・MVP用)
- `/auth/email/send-code` (メール認証コード方式)
- 2つの認証システムが並存し、フロントエンドでも混在

**影響**:
- ユーザーにとって混乱を招く
- セキュリティホールになる可能性
- メンテナンスが困難

**推奨**:
- メール認証コード方式に統一（九州大学メール限定のため）
- `/auth/login` と `/auth/register` を廃止
- フロントエンドを `/email-login` に統一

**修正優先度**: 🔴 **高**

---

### 3. **環境変数ファイルが存在しない**

**問題点**:
- `.env` ファイルが `.gitignore` されており、ローカル開発環境でどう設定すべきか不明
- `SECRET_KEY` がデフォルト値 `"CHANGE_ME"` のまま使用される可能性

**必要な環境変数**:
```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mydatabase
SECRET_KEY=<長いランダム文字列>
APP_ENV=development
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp

# メール送信設定
ENABLE_EMAIL=false  # 開発環境では false
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=noreply@qupid.com
```

**推奨**:
- `.env.example` ファイルを作成
- README に環境変数設定手順を記載

**修正優先度**: 🔴 **高**

---

### 4. **SECRET_KEYが脆弱**

**問題点**:
```python
# app/core/config.py
SECRET_KEY: str = "CHANGE_ME"  # デフォルト値が脆弱
```

- JWTトークンの署名に使用される重要なキー
- 本番環境でもデフォルト値が使用される可能性
- トークンの偽造が可能になる

**推奨**:
```python
import secrets
SECRET_KEY: str = secrets.token_urlsafe(32)  # ランダム生成
```

または環境変数を必須にする:
```python
SECRET_KEY: str  # デフォルト値なし
```

**修正優先度**: 🔴 **高**

---

## ⚠️ 深刻な問題（優先度：中〜高）

### 5. **テストが全く存在しない**

**問題点**:
- フロントエンド、バックエンド共にテストファイルが0個
- Jest, pytest などの設定はあるがテストコードが書かれていない

**影響**:
- バグの早期発見ができない
- リファクタリングが困難
- 品質保証ができない

**推奨**:
最低限必要なテスト:
1. **認証API** のテスト（ログイン、登録、トークン検証）
2. **いいね・マッチング**のテスト
3. **チャット機能**のテスト
4. **フロントエンドのコンポーネントテスト**

**修正優先度**: 🟡 **中**

---

### 6. **リアルタイム通信が未実装**

**問題点**:
- チャット機能がポーリングベース
- 新しいメッセージを受け取るには定期的にAPIを叩く必要がある
- リアルタイム性が低く、サーバー負荷も高い

**ドキュメントに記載あり**:
```markdown
# docs/implementation-plans/04-chat-api.md
将来的には WebSocket でリアルタイム通信を実装予定です。
```

**推奨**:
- FastAPI の WebSocket サポートを使用
- フロントエンドで Socket.io または native WebSocket を実装

**修正優先度**: 🟡 **中**（MVPとしては許容可能）

---

### 7. **エラーハンドリングが不十分**

**問題点**:
- フロントエンドでグローバルエラーバウンダリは存在
- しかし、個別のAPIエラーハンドリングが一貫していない
- Sentryなどのエラー監視ツールが未統合

**現在のコード**:
```typescript
// frontend/src/components/common/ErrorBoundary.tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // TODO: Sentryにエラーを送信  ← 実装されていない
}
```

**推奨**:
1. Sentry統合
2. エラーログの標準化
3. ユーザーフレンドリーなエラーメッセージ

**修正優先度**: 🟡 **中**

---

### 8. **データベースマイグレーションの管理が不明確**

**問題点**:
- `alembic/versions/` と `alembic/versions_backup/` が混在
- どのマイグレーションが最新かが不明確
- `versions_backup` の用途が不明

**ファイル構造**:
```
alembic/
  versions/
    - 27bc47dcce33_initial_schema.py
    - add_email_verification.py
    - add_profile_fields.py
    - ...
  versions_backup/  ← これは何？
    - 06a62eda3ddb_...py
    - 1b0a8793e991_...py
    - ...
```

**推奨**:
1. `versions_backup` を削除または明確に文書化
2. マイグレーション履歴を整理
3. 本番環境での適用手順を文書化

**修正優先度**: 🟡 **中**

---

## ⚡ パフォーマンス・最適化の問題

### 9. **N+1クエリの可能性**

**問題点**:
チャット機能で会話一覧取得時に大量のクエリが発生する可能性

**該当コード**:
```python
# app/routers/chat.py
@router.get("", response_model=ConversationListResponse)
async def get_conversations(...):
    # 会話ごとにメンバー、メッセージを取得
    # ループ内でDBアクセス → N+1の可能性
```

**現状の対策**:
- 一部で `selectinload` を使用してEager Loadingを実装
- しかし全てのエンドポイントで最適化されているかは不明

**推奨**:
- SQLAlchemyのクエリログを有効にして確認
- 必要に応じて `joinedload` や `selectinload` を追加

**修正優先度**: 🟢 **低〜中**

---

### 10. **フロントエンドのバンドルサイズ**

**問題点**:
- 依存関係が多数
- Tree-shakingやコード分割が最適化されているか不明
- Service Worker のキャッシュ戦略が複雑

**package.json**:
```json
"dependencies": {
  "@headlessui/react": "^2.2.9",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "@tanstack/react-query": "^5.90.2",
  "next-pwa": "^5.6.0",
  // ... 他多数
}
```

**推奨**:
1. Next.js Analyzer でバンドルサイズを分析
2. 不要な依存関係を削除
3. Dynamic Importを活用

**修正優先度**: 🟢 **低**

---

## 📝 コード品質・保守性の問題

### 11. **コメントがまちまち**

**問題点**:
- 日本語と英語のコメントが混在
- 一部のファイルはコメントが豊富、一部は全くない
- TODOコメントが放置されている

**TODOの例**:
```python
# app/stores/auth.ts:247
# TODO: リフレッシュトークンのAPI実装

# app/routers/users.py:394
# TODO: 将来的にいいね数などで並び替え

# frontend/src/components/common/ErrorBoundary.tsx:29
// TODO: Sentryにエラーを送信
```

**推奨**:
1. TODOを Issue化して追跡
2. コメントのスタイルガイドを作成
3. 重要な箇所のみコメントを残す

**修正優先度**: 🟢 **低**

---

### 12. **型安全性の不一致**

**問題点**:
バックエンド（Python）とフロントエンド（TypeScript）の型定義が手動管理

**例**:
```python
# app/schemas/user.py
class UserRead(BaseModel):
    id: int
    email: str
    display_name: str
    # ...
```

```typescript
// frontend/src/types/user.ts
export interface User {
  id: number
  email: string
  display_name: string
  // ... バックエンドと手動で同期する必要がある
}
```

**推奨**:
- OpenAPI Generator を使用して自動生成
- または GraphQL を検討

**修正優先度**: 🟢 **低**

---

## 🔧 機能的な問題

### 13. **九州大学メールアドレス検証が不完全**

**問題点**:
- フロントエンドでのみ `@s.kyushu-u.ac.jp` をチェック
- バックエンドでは任意のメールアドレスを受け付ける

**現在のコード**:
```typescript
// frontend/src/lib/validations.ts
.refine((email) => email.endsWith('@s.kyushu-u.ac.jp'), 
  '九州大学のメールアドレスを入力してください')
```

```python
# app/core/config.py
ALLOWED_EMAIL_DOMAIN: str | None = None  # 設定されていない
```

**推奨**:
バックエンドでも必ず検証:
```python
ALLOWED_EMAIL_DOMAIN: str = "s.kyushu-u.ac.jp"  # 必須にする

# ログイン時に検証
if not payload.email.endswith(f"@{settings.ALLOWED_EMAIL_DOMAIN}"):
    raise HTTPException(status_code=403, detail="Invalid email domain")
```

**修正優先度**: 🟡 **中**

---

### 14. **プロフィール完了フラグの競合状態**

**問題点**:
- `profile_completed` フラグの更新とリダイレクトのタイミングで競合が発生
- これまでの修正で改善されたが、まだ完全ではない可能性

**修正履歴**:
- `HYDRATION_FIX_FINAL.md` で Client-Only Rendering に変更
- `LOGOUT_REDIRECT_FIX.md` で window.location.href に変更

**推奨**:
- ユーザーフィードバックを収集
- 必要に応じてさらに改善

**修正優先度**: 🟢 **低**（既に対応済み）

---

### 15. **ファイルアップロードのセキュリティ**

**問題点**:
- ファイルサイズチェックはフロントエンドのみ
- ファイルタイプの検証が不十分
- アップロードされたファイルのスキャン（マルウェア等）が未実装

**現在のコード**:
```typescript
// frontend/src/app/(auth)/initial-profile/page.tsx
if (file.size > 10 * 1024 * 1024) {
  // フロントエンドでのみチェック
}
```

**推奨**:
バックエンドでも必ず検証:
```python
# app/routers/files.py
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif'}

if file.size > MAX_FILE_SIZE:
    raise HTTPException(status_code=413, detail="File too large")
```

**修正優先度**: 🟡 **中**

---

## 🌐 デプロイ・インフラの問題

### 16. **本番環境設定が不明確**

**問題点**:
- `DEPLOYMENT.md` は存在するが、実際にデプロイされているかは不明
- 本番環境のURL、データベース接続情報が不明
- モニタリング・ログ収集が未設定

**推奨**:
1. ステージング環境を構築
2. 本番環境のドキュメント更新
3. Sentry、LogRocket等の監視ツール導入

**修正優先度**: 🟡 **中**

---

### 17. **CI/CDパイプラインが未構築**

**問題点**:
- GitHubへのpush時に自動テスト・デプロイが行われない
- 手動デプロイのみ

**推奨**:
GitHub Actionsで以下を実装:
1. プルリクエスト時の自動テスト
2. mainブランチへのpush時の自動デプロイ
3. Linter、型チェックの自動実行

**修正優先度**: 🟢 **低**

---

### 18. **データベースバックアップ戦略が不明**

**問題点**:
- データベースのバックアップ設定が不明
- 災害復旧計画がない

**推奨**:
1. 定期的な自動バックアップ設定（Render/Railway）
2. バックアップからの復元手順を文書化
3. 本番データの匿名化されたコピーを開発環境に

**修正優先度**: 🟡 **中**（本番運用前に必須）

---

## 📚 ドキュメント・保守性の問題

### 19. **READMEが不完全**

**問題点**:
- ローカル開発環境のセットアップ手順が不明確
- 環境変数の設定方法が記載されていない
- トラブルシューティングガイドがない

**推奨**:
README に以下を追加:
1. **Prerequisites** (Node.js, Python, PostgreSQL のバージョン)
2. **環境変数設定**
3. **ローカル開発手順** (Docker Compose使用)
4. **トラブルシューティング**

**修正優先度**: 🟡 **中**

---

### 20. **APIドキュメントがFastAPI自動生成のみ**

**問題点**:
- `/docs` エンドポイントで Swagger UI は利用可能
- しかし、使用例やエラーケースの説明が不足
- フロントエンド開発者向けの説明が不足

**推奨**:
1. OpenAPI仕様書を export
2. Postman Collection を作成
3. エンドポイントの使用例を README に記載

**修正優先度**: 🟢 **低**

---

## 🎯 優先順位まとめ

### 🔴 最優先（即座に対応）
1. **パスワード認証の実装**
2. **SECRET_KEYの強化**
3. **環境変数ファイルの整備**

### 🟡 高優先度（近日中に対応）
4. **認証システムの統一**
5. **九州大学メールアドレス検証**
6. **ファイルアップロードのセキュリティ**
7. **テストの追加**
8. **エラーハンドリング改善**

### 🟢 中優先度（時間があれば対応）
9. **リアルタイム通信（WebSocket）**
10. **データベースマイグレーション整理**
11. **N+1クエリ対策**
12. **デプロイメント自動化**
13. **READMEの改善**

### ⚪ 低優先度（将来的に対応）
14. **コード品質改善**
15. **型安全性の向上**
16. **バンドルサイズ最適化**
17. **APIドキュメント拡充**

---

## 💡 推奨される次のステップ

### Week 1: セキュリティ強化
- [ ] パスワード認証の実装
- [ ] SECRET_KEYの環境変数化
- [ ] `.env.example` 作成

### Week 2: 認証システム統一
- [ ] メール認証に統一
- [ ] 旧エンドポイントの廃止
- [ ] フロントエンド更新

### Week 3: テストの追加
- [ ] 認証APIテスト
- [ ] いいね・マッチングテスト
- [ ] チャット機能テスト

### Week 4: ドキュメント整備
- [ ] README更新
- [ ] API使用例追加
- [ ] トラブルシューティングガイド

---

## 📊 プロジェクト健全性スコア

| カテゴリ | スコア | 評価 |
|---------|-------|------|
| **セキュリティ** | 30/100 | 🔴 改善必須 |
| **テスト** | 0/100 | 🔴 全く存在しない |
| **コード品質** | 65/100 | 🟡 改善の余地あり |
| **パフォーマンス** | 70/100 | 🟢 概ね良好 |
| **ドキュメント** | 60/100 | 🟡 不完全 |
| **インフラ** | 50/100 | 🟡 基本はOK |

**総合スコア**: **46/100** 🟡

---

## 🎓 学習ポイント・良い点

### 実装されている素晴らしい機能
✅ **メール認証コード方式** - ユーザーフレンドリー  
✅ **PWA対応** - オフライン対応とインストール可能  
✅ **音声メッセージ** - 独自性のある機能  
✅ **包括的なプロフィール** - LGBTQ+に配慮  
✅ **ブロック・通報機能** - セーフティ重視  
✅ **Figmaベースのデザイン** - 洗練されたUI  

### アーキテクチャの良い点
✅ FastAPI + Next.js の最新スタック  
✅ TypeScript による型安全性  
✅ Zustand による効率的な状態管理  
✅ React Query によるサーバー状態管理  
✅ Alembic によるマイグレーション管理  
✅ Docker による環境の一貫性  

---

## 🤝 まとめ

このプロジェクトは **機能的には充実している**が、**セキュリティとテストが不十分**です。

特に **パスワード認証の欠如** は重大な問題であり、**最優先で対応すべき**です。

しかし、全体的なアーキテクチャは良好で、適切に改善すれば素晴らしいプロダクトになる可能性が高いです。

**推奨アプローチ**:
1. まずセキュリティ問題を解決（Week 1-2）
2. 基本的なテストを追加（Week 3）
3. ドキュメントを整備（Week 4）
4. その後、機能追加とUI改善を継続

---

**調査者**: AI Assistant  
**調査日時**: 2025-10-27  
**調査方法**: コードベース全体の静的解析 + ドキュメントレビュー

