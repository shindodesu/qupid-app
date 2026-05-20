# 画像表示/CORS 障害デバッグ記録（2026-04-24）

## 対象
- 本番/開発でのプロフィール画像表示不具合
- 本番でのログイン・ユーザー一覧取得時のCORSエラー

## 事象サマリ
- プロフィール画面でヘッダーのみ表示され、本文が描画されないケースが発生
- チャット画面で画像表示エラーが発生
- 本番環境でのみ画像取得失敗（`avatar_url` に改行混入）
- `NEXT_PUBLIC_API_URL` の切り替え後、`/users/suggestions` と `/auth/login` がCORSで失敗

## 主な原因
1. **DBスキーマ不整合**
   - `users.show_campus` 列が存在せず、認証APIが500で失敗
2. **画像URLデータ不正**
   - `avatar_url` に `\n`（改行）や空白が混入し、不正URL化
3. **画像フォールバック実装の不足**
   - 一部画面の `<img>` で読み込み失敗時フォールバックが未実装
4. **本番CORS/環境変数の不整合**
   - フロントが参照するAPIホストと、Render側CORS許可の組み合わせが不一致

## 実施した対応
### 1) データ/DB対応
- `users` テーブルに不足していた `show_campus` 列を追加
- テストユーザーを追加し、表示確認用アバターを一括設定
- `users.avatar_url` の改行/空白を正規化するSQLを実行
- 正規化時の副作用（`uploads/avatars` → `upload/avatar`）を検知し、即時復元

### 2) フロント対応
- `frontend/src/lib/utils/image.ts`
  - `sanitizeUrlLike()` を追加
  - `getAvatarUrl()` / `getImageUrl()` で改行・タブ・余分な空白を除去
- `frontend/src/components/features/chat/ChatWindow.tsx`
  - チャットヘッダー画像に `onError` フォールバックを追加
- `frontend/src/components/ui/Avatar.tsx`
  - 共通Avatarコンポーネントに `onError` フォールバックを追加
- `home` グリッド画像のLCP警告対策
  - 先頭表示カードのみ `priority` を付与

### 3) 検証
- ローカルAPIで `/auth/login` が200になることを確認
- 画像URL (`/uploads/avatars/...`) が200で返ることを確認
- lintチェック（編集ファイル）でエラーなしを確認

## 本番向け設定確認ポイント
### Vercel（Frontend）
- `NEXT_PUBLIC_API_URL` が実際のAPIホストになっていること
- 変更後にProduction再デプロイ済みであること

### Render（Backend）
- `CORS_ORIGINS` に `https://qupid-app.vercel.app` を含めること
- 変更後に再デプロイ済みであること

## 現在の結論
- 画像不具合は「表示ロジック」だけでなく、「データ不正（改行混入）」と「環境設定不整合」の複合要因
- クライアント側サニタイズ + DB正規化 + CORS設定整合の3点を揃えないと再発する

## 再発防止アクション
- 画像URLはDBに**相対パス**で保存（`uploads/avatars/...`）を徹底
- URL保存時にサーバー側でも改行/空白サニタイズを実施
- デプロイ時チェック項目に以下を追加
  - `NEXT_PUBLIC_API_URL`
  - `CORS_ORIGINS`
  - 本番での `OPTIONS /auth/login`・`OPTIONS /users/suggestions` 成功確認
