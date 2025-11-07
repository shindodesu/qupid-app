# フロントエンド実装計画書: 統合・最適化

## 📋 概要
バックエンドAPIとの統合、非機能要件（パフォーマンス/セキュリティ/アクセシビリティ）最適化、CI/CDと運用を含む最終工程の計画。

## 🔌 API統合
- OpenAPI 仕様の取り込み（将来）: `openapi-typescript` で型生成
- 環境変数でAPIベースURLを切替（dev/stg/prod）
- 失敗時リトライ/指数バックオフ（React Query）

## 🧪 品質保証
- 単体テスト > 80%（Jest/RTL）
- 統合テスト（MSWでAPIモック）
- E2Eテスト（Playwright）: 主要フロー
  - 認証→登録→検索→いいね→マッチ→チャット→ブロック

## 🛡️ セキュリティ
- 依存監査（`npm audit`/`pnpm audit`）
- CSP/Permissions-Policy/Referrer-Policy ヘッダ
- 機密情報を `NEXT_PUBLIC_` に置かない（公開前提）
- Sentry でPIIサニタイズ

## ⚡ パフォーマンス
- 画像最適化（Next/Image、適切な`priority`）
- ルート分割・動的import
- メモ化（`memo`, `useMemo`, `useCallback`）
- React Query キャッシュポリシー調整
- Core Web Vitals 監視（Lighthouse/Next Analytics）

## ♿ アクセシビリティ
- アクセシブルなコンポーネント（Headless UI/Radix）
- キーボード操作、フォーカス可視化
- コントラスト比 WCAG AA
- スクリーンリーダー対応（`aria-*`）

## 🔁 リリース/運用
- Vercel プロジェクト（Preview→Production）
- GitHub Actions: Lint/Test/Build → Vercel デプロイ
- フィーチャーフラグ（環境変数/実験機能ガード）

## 📋 最終チェックリスト
- [ ] .env とビルド設定の整合
- [ ] APIベースURL切替の確認
- [ ] Lighthouse 90+（モバイル/デスクトップ）
- [ ] E2Eグリーン
- [ ] アクセシビリティ監査
- [ ] 監視（Sentry/Analytics）有効

---
作成日: 2025-10-13 / 担当: Qupid開発チーム



