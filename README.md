# Qupid - 九州大学LGBTQ+学生向けマッチングアプリ

## 📖 はじめに

九州大学のLGBTQ当事者学生のためのマッチングアプリ「Qupid」の開発を目指しています。  
このアプリの目的は、新たな恋人探しの場とするだけでなく、LGBTQ当事者同士の友人作りを支援することにあります。  
現在、学内のアイデアバトルに採択されたプロジェクトとして開発を進めており、安全・匿名性・多様性に配慮した設計を重視しています。

### Qupidのメリット
- ✅ 九州大学の学生限定だから安心
- ✅ 恋人づくりも友達づくりもOK
- ✅ 匿名・顔出し不要
- ✅ 通報・ブロック機能で安心

### 使い方（予定）
1. 九州大学の学生メール（@s.kyushu-u.ac.jp）で認証し、匿名プロフィールを登録  
2. 気になる相手を検索して「いいね」送信  
3. マッチしたらチャットでトークを開始！

---

## 🏗️ 技術スタック

### バックエンド
- **FastAPI** - 高速でモダンなPythonウェブフレームワーク
- **PostgreSQL** / SQLite - データベース
- **SQLAlchemy 2.0** - ORM（非同期対応）
- **Alembic** - データベースマイグレーション
- **Pydantic** - データバリデーション
- **JWT** - 認証トークン
- **Passlib + bcrypt** - パスワードハッシュ化

### フロントエンド
- **Next.js 15** (App Router) - Reactフレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Zustand** - 状態管理
- **React Query** - サーバー状態管理
- **PWA** - オフライン対応・インストール可能

---

## 🚀 ローカル開発環境のセットアップ

### 前提条件
- Python 3.11以上
- Node.js 18以上
- PostgreSQL 14以上（または SQLite）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd Qupid
```

### 2. バックエンドのセットアップ

#### 2.1 仮想環境の作成と有効化

```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

#### 2.2 依存関係のインストール

```bash
pip install -r requirements.txt
```

#### 2.3 環境変数の設定

`env.template` を `.env` にコピーして編集：

```bash
cp env.template .env
```

`.env` ファイルを編集：

```env
# データベース設定
DATABASE_URL=sqlite+aiosqlite:///./qupid.db
# または PostgreSQL:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/qupid

# SECRET_KEYを生成
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# アプリケーション設定
APP_ENV=development
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp

# メール送信（開発環境では無効化）
ENABLE_EMAIL=false
# 本番環境ではメール送信を有効化:
# ENABLE_EMAIL=true
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# FROM_EMAIL=noreply@qupid.com
```

#### 2.4 データベースマイグレーション

```bash
alembic upgrade head
```

#### 2.5 バックエンドサーバーの起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**APIドキュメント**:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. フロントエンドのセットアップ

#### 3.1 ディレクトリ移動

```bash
cd frontend
```

#### 3.2 依存関係のインストール

```bash
npm install
```

#### 3.3 環境変数の設定

`.env.local` ファイルを作成：

```bash
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

#### 3.4 フロントエンドサーバーの起動

```bash
npm run dev
```

フロントエンド: http://localhost:3000

---

## 🐳 Dockerでの起動（推奨）

Docker Composeを使用すると、より簡単に起動できます：

```bash
# ビルドと起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down
```

---

## 🔐 セキュリティに関する注意事項

### 本番環境へのデプロイ前に必須の設定

1. **SECRET_KEYの変更**
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   生成された文字列を `.env` の `SECRET_KEY` に設定してください。

2. **DATABASE_URLの変更**
   - 本番環境では必ずPostgreSQLを使用してください
   - SQLiteは開発環境専用です

3. **ALLOWED_EMAIL_DOMAINの確認**
   - 九州大学メールドメイン（`s.kyushu-u.ac.jp`）が設定されているか確認

4. **APP_ENVの設定**
   - 本番環境では `APP_ENV=production` に設定

---

## 📁 プロジェクト構造

```
Qupid/
├── app/                    # バックエンド (FastAPI)
│   ├── core/              # コア機能（認証、設定）
│   ├── db/                # データベース接続
│   ├── models/            # SQLAlchemyモデル
│   ├── routers/           # APIエンドポイント
│   ├── schemas/           # Pydanticスキーマ
│   └── services/          # ビジネスロジック
├── frontend/              # フロントエンド (Next.js)
│   ├── src/
│   │   ├── app/          # App Routerページ
│   │   ├── components/   # Reactコンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── lib/          # ユーティリティ
│   │   ├── stores/       # Zustand状態管理
│   │   └── types/        # TypeScript型定義
│   └── public/           # 静的ファイル
├── alembic/              # データベースマイグレーション
├── docs/                 # ドキュメント
├── uploads/              # ファイルアップロード先
├── .env.example          # 環境変数テンプレート
├── requirements.txt      # Pythonパッケージ
└── README.md            # このファイル
```

---

## 🧪 テストの実行

### バックエンドテスト

```bash
# すべてのテストを実行
pytest

# カバレッジ付きで実行
pytest --cov=app --cov-report=term-missing

# 特定のテストのみ実行
pytest tests/test_auth_password.py
pytest -m auth  # auth マーカーのテストのみ

# HTMLカバレッジレポート生成
pytest --cov=app --cov-report=html
```

**実装済みテスト**: 22テスト（カバレッジ 53%）
- `tests/test_auth_password.py` - パスワード認証テスト（10テスト）
- `tests/test_auth_email.py` - メール認証テスト（12テスト）

### フロントエンドテスト

```bash
cd frontend

# すべてのテストを実行
npm test

# ウォッチモードで実行
npm run test:watch

# カバレッジ付きで実行
npm run test:coverage
```

**実装済みテスト**: 28テスト
- `src/components/ui/__tests__/Button.test.tsx` - 7テスト
- `src/components/ui/__tests__/Input.test.tsx` - 8テスト
- `src/components/ui/__tests__/Skeleton.test.tsx` - 8テスト
- `src/components/auth/__tests__/LoginForm.test.tsx` - 5テスト

---

## 📝 トラブルシューティング

### よくある問題

#### 1. `SECRET_KEY が設定されていない` エラー

**解決策**: `.env` ファイルに `SECRET_KEY` を追加してください。

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 2. データベース接続エラー

**解決策**: `DATABASE_URL` を確認してください。開発環境ではSQLiteを推奨します。

```env
DATABASE_URL=sqlite+aiosqlite:///./qupid.db
```

#### 3. マイグレーションエラー

**解決策**: マイグレーション履歴をリセットして再実行してください。

```bash
# データベースを削除（開発環境のみ）
rm qupid.db

# マイグレーションを再実行
alembic upgrade head
```

#### 4. フロントエンドがバックエンドに接続できない

**解決策**: `frontend/.env.local` に正しいAPIのURLが設定されているか確認してください。

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📧 メール認証システム

### 機能

Qupidは、安全なメール認証システムを実装しています：

- ✅ **6桁の認証コード** - メールアドレスの検証
- ✅ **HTMLメール** - 美しいレスポンシブデザイン
- ✅ **自動リトライ** - 送信失敗時の自動再送
- ✅ **レート制限** - スパムや悪用を防止
- ✅ **パスワードリセット** - 安全なパスワード変更
- ✅ **ウェルカムメール** - 新規ユーザーへの挨拶

### 開発環境

開発環境では、メール送信は**無効化**されており、認証コードはコンソールに出力されます：

```bash
=== メール認証コード ===
宛先: test@s.kyushu-u.ac.jp
認証コード: 123456
======================
```

### 本番環境セットアップ

本番環境でメール送信を有効にする方法：

1. **環境変数を設定**
```bash
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@qupid.com
```

2. **メール送信をテスト**
```bash
python dev_tools/test_email_service.py --email your-test@example.com
```

詳細は [メール認証システムセットアップガイド](docs/EMAIL_PRODUCTION_SETUP.md) を参照してください。

### サポートされているメールプロバイダー

- **Gmail** - 開発・小規模向け（無料、1日500通まで）
- **SendGrid** - 中〜大規模向け（無料プランで1日100通まで）
- **Amazon SES** - 大規模向け（1,000通で$0.10）

---

## 🤝 貢献方法

プルリクエストを歓迎します！大きな変更の場合は、まずIssueを開いて議論してください。

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

---

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。

---

## 📞 お問い合わせ

質問や提案がある場合は、Issueを作成してください。