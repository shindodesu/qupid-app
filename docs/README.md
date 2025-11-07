# Qupid ドキュメント

このディレクトリには、Qupidアプリケーションの開発・運用に関するドキュメントが整理されています。

## 📁 ディレクトリ構成

### 📋 requirements/ - 要件定義
プロジェクトの要件定義、仕様書、実装サマリー

- `requirements.md` - プロジェクト要件定義
- `implementation-summary-tags.md` - タグ機能の実装サマリー

### 🔧 backend-implementation/ - バックエンド実装計画書
バックエンドAPI、データベース、認証システムなどの実装計画と実装状況

- `01-tag-management.md` - タグ管理機能の実装計画
- `02-like-matching.md` - いいね・マッチング機能の実装計画
- `03-user-search.md` - ユーザー検索機能の実装計画
- `04-chat-api.md` - チャットAPIの実装計画
- `05-report-block.md` - 報告・ブロック機能の実装計画
- `AUTH_IMPLEMENTATION_STATUS.md` - 認証機能の実装状況レポート
- `EMAIL_ARCHITECTURE.md` - メールシステムのアーキテクチャ
- `EMAIL_SYSTEM_SUMMARY.md` - メールシステムの概要
- `HYBRID_AUTH_SYSTEM.md` - ハイブリッド認証システムの説明

### 🎨 frontend-implementation/ - フロントエンド実装計画書
フロントエンドUI、コンポーネント、ページの実装計画

- `01-tech-stack-foundation.md` - 技術スタックの基盤構築
- `02-auth-profile.md` - 認証・プロフィール機能
- `03-discover-page.md` - 発見ページの実装
- `04-chat.md` - チャット機能の実装
- `05-safety.md` - 安全機能の実装
- `06-integration-optimizations.md` - 統合と最適化

### 🐛 debugging/ - デバッグ記録
問題解決、デバッグセッション、修正記録

- `AUTH_DEBUG_GUIDE.md` - 認証デバッグガイド
- `AUTH_FIX_SUMMARY.md` - 認証修正サマリー
- `AUTH_TEST_GUIDE.md` - 認証テストガイド
- `CACHE_DEBUGGING_REPORT.md` - キャッシュデバッグレポート
- `DEPLOYMENT.md` - デプロイメント関連の記録
- `FINAL_IMPLEMENTATION_REPORT.md` - 最終実装レポート
- `FIXES_APPLIED.md` - 適用された修正の記録
- `FIXES_QUICK_REFERENCE.md` - 修正のクイックリファレンス
- `HYDRATION_FIX_FINAL.md` - ハイドレーション修正（最終版）
- `HYDRATION_FIX_V2.md` - ハイドレーション修正（v2）
- `HYDRATION_REDIRECT_FIX.md` - ハイドレーションリダイレクト修正
- `IMPLEMENTATION_COMPLETE.md` - 実装完了レポート
- `INCONSISTENCY_REPORT.md` - 不整合レポート
- `ISSUES_QUICK_REFERENCE.md` - 問題のクイックリファレンス
- `LOGOUT_FIX.md` - ログアウト修正
- `LOGOUT_REDIRECT_FIX.md` - ログアウトリダイレクト修正
- `MIDDLEWARE_UPDATE.md` - ミドルウェア更新
- `MOBILE_DEBUG_SESSION_SUMMARY.md` - モバイルデバッグセッションサマリー
- `MOBILE_NAVIGATION_POSITION_ATTEMPT.md` - モバイルナビゲーション位置の試行
- `MOBILE_REDIRECT_LOOP_FIX.md` - モバイルリダイレクトループ修正
- `PROFILE_DISPLAY_FIX.md` - プロフィール表示修正
- `PROJECT_ISSUES_COMPREHENSIVE_REPORT.md` - プロジェクト問題総合レポート
- `PWA_IMAGE_LOADING_DEBUG.md` - PWA画像読み込みデバッグ
- `QUICK_DEPLOY.md` - クイックデプロイ
- `README_CHAT.md` - チャット機能のREADME
- `README_INTEGRATION.md` - 統合のREADME
- `README_SAFETY.md` - 安全機能のREADME
- `README_SEARCH.md` - 検索機能のREADME
- `URGENT_FIX.md` - 緊急修正

### 📦 other/ - その他
セットアップ、デプロイメント、レビュー、監査、最適化など

#### other/setup-deployment/ - セットアップ・デプロイメント
- `PRODUCTION_SETUP.md` - 本番環境のセットアップ手順
- `PRODUCTION_SETUP_CHECKLIST.md` - 本番環境セットアップのチェックリスト
- `RENDER_DEPLOYMENT_GUIDE.md` - Renderへのデプロイガイド
- `RENDER_SMTP_TROUBLESHOOTING.md` - Render SMTP設定のトラブルシューティング
- `VERCEL_SETUP.md` - Vercelのセットアップ手順
- `EMAIL_PRODUCTION_SETUP.md` - メールシステムの本番環境セットアップ
- `EMAIL_QUICK_START.md` - メールシステムのクイックスタートガイド

#### other/reviews-audits/ - レビュー・監査
- `GITHUB_CODE_REVIEW.md` - GitHubでコードレビューを受ける方法
- `SECURITY_AUDIT.md` - セキュリティ監査レポート

#### other/optimization/ - 最適化
- `PERFORMANCE_OPTIMIZATION.md` - パフォーマンス最適化の記録

### 🖼️ images/ - 画像リソース
ドキュメントで使用する画像ファイル

## 🔍 ドキュメントの探し方

### コードレビューを依頼する場合
1. **バックエンドのレビュー**: `backend-implementation/` フォルダを確認
2. **フロントエンドのレビュー**: `frontend-implementation/` フォルダを確認
3. **レビュー方法**: `other/reviews-audits/GITHUB_CODE_REVIEW.md` を参照

### 実装計画を確認する場合
1. **バックエンド機能**: `backend-implementation/` の番号付きファイルを確認
2. **フロントエンド機能**: `frontend-implementation/` の番号付きファイルを確認
3. **要件確認**: `requirements/` フォルダを確認

### 問題が発生した場合
1. `debugging/` フォルダを確認
2. 類似の問題の修正記録を探す
3. `FIXES_QUICK_REFERENCE.md` や `ISSUES_QUICK_REFERENCE.md` を参照

### セットアップを行う場合
1. `other/setup-deployment/` フォルダを確認
2. 環境に応じたセットアップガイドを参照

## 📌 主要ドキュメントへのクイックリンク

### 要件定義
- [プロジェクト要件](./requirements/requirements.md)

### バックエンド実装
- [認証機能実装状況](./backend-implementation/AUTH_IMPLEMENTATION_STATUS.md)
- [チャットAPI実装計画](./backend-implementation/04-chat-api.md)

### フロントエンド実装
- [技術スタック基盤](./frontend-implementation/01-tech-stack-foundation.md)
- [チャット機能](./frontend-implementation/04-chat.md)

### その他
- [GitHubコードレビュー方法](./other/reviews-audits/GITHUB_CODE_REVIEW.md)
- [本番環境セットアップ](./other/setup-deployment/PRODUCTION_SETUP.md)
