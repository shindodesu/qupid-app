# 🚀 クイックデプロイガイド

テストユーザー向けに5分でデプロイする手順です。

## 📋 必要なもの

- GitHubアカウント
- Vercelアカウント（無料）
- Renderアカウント（無料）

## ⚡ 5ステップでデプロイ

### ステップ1: GitHubにコードをプッシュ（未実施の場合）

```bash
cd /Users/shindokosuke/Qupid
git add .
git commit -m "feat: テスト環境デプロイ準備完了"
git push origin main
```

### ステップ2: バックエンドをRenderにデプロイ（3分）

#### 2-1. Renderにアクセス
- https://render.com/ にアクセス
- GitHubアカウントでサインアップ/ログイン

#### 2-2. PostgreSQL作成
1. 「New +」→「PostgreSQL」
2. 設定：
   - Name: `qupid-db`
   - Database: `mydatabase`
   - User: `user`
   - Region: Singapore
3. 「Create Database」をクリック
4. **Internal Database URL** をコピー（例: `postgresql://user:xxx@xxx.oregon-postgres.render.com/mydatabase`）

#### 2-3. Web Service作成
1. 「New +」→「Web Service」
2. GitHubリポジトリ `Qupid` を選択
3. 設定：
   - Name: `qupid-api`
   - Region: Singapore
   - Branch: main（または現在のブランチ名）
   - Root Directory: （空白）
   - Runtime: **Docker**
   - Plan: Free
4. **Environment Variables** に追加：
   ```
   DATABASE_URL = postgresql+asyncpg://user:password@host.render.com/mydatabase
   （↑ コピーしたURLの postgresql:// を postgresql+asyncpg:// に変更）
   
   SECRET_KEY = your-secret-key-change-me
   ENVIRONMENT = production
   ALLOWED_ORIGINS = https://qupid.vercel.app,http://localhost:3000
   ```
5. 「Create Web Service」をクリック
6. デプロイ完了後、URLをコピー（例: `https://qupid-api.onrender.com`）

### ステップ3: フロントエンドをVercelにデプロイ（2分）

#### 3-1. Vercelにアクセス
- https://vercel.com/ にアクセス
- GitHubアカウントでサインアップ/ログイン

#### 3-2. プロジェクト作成
1. 「Add New...」→「Project」
2. GitHubリポジトリ `Qupid` をインポート
3. 設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. **Environment Variables** に追加：
   ```
   NEXT_PUBLIC_API_URL = https://qupid-api.onrender.com
   （↑ Step 2でコピーしたRenderのURL）
   
   NODE_ENV = production
   ```
5. 「Deploy」をクリック
6. デプロイ完了後、URLをコピー（例: `https://qupid.vercel.app`）

### ステップ4: バックエンドのCORS設定を更新

1. `app/core/config.py` を開く
2. `ALLOWED_ORIGINS` にVercelのURLを追加：
   ```python
   ALLOWED_ORIGINS: str = "http://localhost:3000,https://qupid.vercel.app,https://your-actual-vercel-url.vercel.app"
   ```
3. コミット＆プッシュ：
   ```bash
   git add app/core/config.py
   git commit -m "fix: Add Vercel URL to CORS"
   git push
   ```
4. Renderが自動的に再デプロイ（約3分）

### ステップ5: 動作確認

1. Vercelの本番URLにアクセス
2. ユーザー登録してテスト
3. 各機能が動作することを確認

## ✅ デプロイ完了チェックリスト

- [ ] バックエンドDB作成完了
- [ ] バックエンドAPI作成完了（`https://xxx.onrender.com`）
- [ ] フロントエンド作成完了（`https://xxx.vercel.app`）
- [ ] CORS設定更新完了
- [ ] ログインできることを確認
- [ ] プロフィール編集できることを確認
- [ ] 検索機能が動作することを確認

## 🎯 テストユーザーへの共有

デプロイ完了後、以下の情報を共有：

```
🎉 Qupidテスト環境が利用可能です！

URL: https://your-app.vercel.app

【テストアカウント】
メール: test@s.kyushu-u.ac.jp
パスワード: test123

または新規登録してお試しください！

【注意事項】
- 無料プランのため、15分操作がないと自動的にスリープします
- 初回アクセス時、起動に30秒ほどかかる場合があります
- テスト環境のため、データは予告なくリセットされる可能性があります
```

## 🔄 更新のデプロイ

コードを更新した場合：

```bash
git add .
git commit -m "更新内容"
git push
```

- **Vercel**: 自動的に再デプロイ（2-3分）
- **Render**: 自動的に再デプロイ（5-7分）

## 💡 Tips

### Renderの起動を早くする
- 有料プラン（$7/月）で常時起動
- またはcronジョブで定期的にpingを送る

### Vercelのプレビュー環境
- プルリクエストごとにプレビューURLが自動生成
- 機能テストに便利

### カスタムドメイン
- Vercelで独自ドメイン設定可能（例: qupid.app）
- DNSレコードを設定するだけ

---

**所要時間**: 約10分
**難易度**: ⭐⭐☆☆☆（簡単）

