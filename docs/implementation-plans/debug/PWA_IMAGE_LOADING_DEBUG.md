# PWAでの画像読み込み問題デバッグガイド

## 📋 問題概要

**報告された問題**: アプリ版（PWA）でプロフィールの画像がうまく読み込めない

**発生環境**: PWAモード（ホーム画面に追加されたアプリとして起動）

**影響範囲**: 
- プロフィールページのアバター画像
- その他のユーザー画像表示

---

## 🔍 問題の調査

### 1. 画像URLの構築方法

画像URLは `frontend/src/lib/utils/image.ts` の `getAvatarUrl()` 関数で構築されています。

### 2. 関連ファイル

- `frontend/src/lib/utils/image.ts` - 画像URL構築ロジック
- `frontend/src/app/(dashboard)/profile/page.tsx` - プロフィールページ（画像表示）
- `frontend/next.config.ts` - Next.js設定（CSP、画像最適化）
- `frontend/public/sw-custom.js` - Service Worker

---

## 🐛 想定される原因

### 原因1: 環境変数がビルド時にバンドルされていない

**問題**: PWAとしてインストールしたアプリでは、ビルド時の環境変数が正しく埋め込まれていない可能性

### 原因2: Service Workerが画像リクエストをインターセプトしている

**問題**: Service WorkerがAPIサーバーからの画像リクエストを誤ってキャッシュまたはブロックしている可能性

### 原因3: CSP（Content Security Policy）の制限

**問題**: CSPの `img-src` ディレクティブが画像の読み込みをブロックしている

### 原因4: 相対パスの扱い

**問題**: データベースから取得した `avatar_url` が相対パスの場合、URL構築が正しくない可能性

---

## 🔧 実装した修正

### 修正1: デバッグログの追加

**コミット**: `22ddca3` - "fix: PWAでの画像読み込み問題を修正するためのデバッグログを追加"

**変更内容**:
- `getApiUrl()` 関数を追加して実行時に環境変数を取得
- 画像URL構築時の詳細なログを追加

**ファイル**: `frontend/src/lib/utils/image.ts`

---

## 🔬 デバッグ手順

### ステップ1: コンソールログの確認

1. PWAモードでアプリを起動
2. プロフィールページに移動
3. ブラウザの開発者ツールを開く
4. Consoleタブで以下のログを確認:

```
[getAvatarUrl] Input: uploads/avatars/xxx.png
[getAvatarUrl] API URL: https://api.qupid.app
[getAvatarUrl] Constructed URL: https://api.qupid.app/uploads/avatars/xxx.png
```

### ステップ2: ネットワークタブの確認

開発者ツール → Networkタブで画像リクエストのStatusを確認

### ステップ3: Service Workerの確認

開発者ツール → Applicationタブ → Service Workers で確認

### ステップ4: 環境変数の確認

Vercelダッシュボードで `NEXT_PUBLIC_API_URL` が設定されているか確認

---

## 📝 チェックリスト

- [ ] PWAモードでアプリを起動
- [ ] 開発者ツールのConsoleでログを確認
- [ ] `[getAvatarUrl] API URL:` が正しい値か確認
- [ ] Networkタブで画像リクエストのStatusを確認
- [ ] Service Workerが画像リクエストをインターセプトしていないか確認
- [ ] CSPエラーが発生していないか確認

### 解決済み

- [x] デバッグログを追加
- [ ] 原因を特定
- [ ] 根本的な修正を実装

---

**作成日**: 2025-01-XX
**ステータス**: 調査中
