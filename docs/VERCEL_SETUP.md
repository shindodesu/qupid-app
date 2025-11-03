# 🚀 Vercel（フロントエンド）セットアップガイド

## 📋 必須設定

### 1. 環境変数の設定

Vercelダッシュボードで、プロジェクトの「Settings」→「Environment Variables」に以下を設定してください：

#### 本番環境（Production）

```bash
NEXT_PUBLIC_API_URL=https://qupid-app.onrender.com
```

#### プレビュー環境（Preview）

```bash
NEXT_PUBLIC_API_URL=https://qupid-app.onrender.com
```

#### 開発環境（Development）

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**設定方法：**
1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. 「Settings」タブを開く
4. 「Environment Variables」セクションを開く
5. 「Add New」をクリック
6. 以下を入力：
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://qupid-app.onrender.com`
   - **Environment**: 「Production」「Preview」「Development」すべてにチェック
7. 「Save」をクリック

### 2. 環境変数の確認

設定後、以下を確認してください：

1. **環境変数が正しく設定されているか**
   - Vercelダッシュボード → プロジェクト → Settings → Environment Variables
   - `NEXT_PUBLIC_API_URL` が表示されていることを確認

2. **デプロイ後に反映されているか**
   - 新しいデプロイを実行（または既存のデプロイを確認）
   - ビルドログに環境変数が使用されているか確認

3. **ブラウザで確認**
   - デプロイされたアプリを開く
   - ブラウザの開発者ツール → Console
   - `process.env.NEXT_PUBLIC_API_URL` を実行して値が正しいか確認

## 🔍 トラブルシューティング

### 問題1: APIリクエストが `localhost:8000` に送信される

**原因**: 環境変数が設定されていない、またはデプロイ後に反映されていない

**解決方法**:
1. Vercelダッシュボードで環境変数を再確認
2. 新しいデプロイを実行（環境変数を変更した後は再デプロイが必要）
3. ビルドログで環境変数が読み込まれているか確認

### 問題2: CORSエラーが発生する

**原因**: バックエンドのCORS設定とフロントエンドのURLが一致していない

**解決方法**:
1. バックエンド（Render）の `CORS_ORIGINS` 環境変数に、フロントエンドのURLを追加
2. フロントエンドのURLが `https://frontend-seven-psi-84.vercel.app` であることを確認
3. バックエンドを再デプロイ

### 問題3: 環境変数が反映されない

**原因**: Next.jsのビルド時に環境変数がバンドルされている

**解決方法**:
1. **重要**: `NEXT_PUBLIC_` プレフィックスが付いていることを確認
2. 環境変数を変更した後、必ず再デプロイを実行
3. Vercelのキャッシュをクリア（Settings → General → Clear Build Cache）

## 📝 設定チェックリスト

- [ ] `NEXT_PUBLIC_API_URL` 環境変数が設定されている
- [ ] 環境変数の値が `https://qupid-app.onrender.com` である
- [ ] Production、Preview、Developmentすべての環境に設定されている
- [ ] 環境変数設定後に再デプロイを実行した
- [ ] ブラウザで `process.env.NEXT_PUBLIC_API_URL` が正しい値を返す
- [ ] APIリクエストが正しいURLに送信されている
- [ ] CORSエラーが発生しない

## 🔗 関連ドキュメント

- [本番環境セットアップチェックリスト](PRODUCTION_SETUP_CHECKLIST.md)
- [CORS設定の詳細](PRODUCTION_SETUP_CHECKLIST.md#1--cors設定必須)

