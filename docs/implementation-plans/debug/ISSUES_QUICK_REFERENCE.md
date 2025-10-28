# 🚨 Qupid プロジェクト - 問題点クイックリファレンス

## 🔴 最優先（今すぐ修正）

### 1. パスワード認証が存在しない
```python
# 現状: app/routers/auth.py
@router.post("/login")
async def login(payload: LoginRequest, ...):
    # パスワード検証なし！誰でもログインできる
```
**リスク**: 極めて深刻なセキュリティホール

### 2. SECRET_KEY が脆弱
```python
# app/core/config.py
SECRET_KEY: str = "CHANGE_ME"  # デフォルト値のまま
```
**リスク**: JWTトークンが偽造可能

### 3. 環境変数ファイルがない
`.env` ファイルが存在せず、設定方法が不明
**リスク**: 開発環境のセットアップができない

---

## 🟡 高優先度（1-2週間以内）

### 4. 認証システムが2つ混在
- `/auth/login` (パスワードなし)
- `/auth/email/send-code` (メール認証コード)

**推奨**: メール認証に統一

### 5. 九州大学メール検証がフロントエンドのみ
バックエンドでも検証が必要

### 6. テストが全く存在しない
- フロントエンド: 0テスト
- バックエンド: 0テスト

### 7. ファイルアップロードの検証が不十分
フロントエンドのみでサイズ・タイプチェック

### 8. エラーハンドリングが不完全
Sentryなどの監視ツール未統合

---

## 🟢 中優先度（1ヶ月以内）

### 9. WebSocketが未実装
チャットがポーリングベース → サーバー負荷高

### 10. N+1クエリの可能性
会話一覧取得で最適化が不十分

### 11. データベースマイグレーション管理が不明確
`versions/` と `versions_backup/` の関係が不明

### 12. デプロイメント自動化なし
CI/CDパイプライン未構築

---

## ⚪ 低優先度（時間があれば）

### 13. コード品質のばらつき
- コメントが日本語・英語混在
- TODO多数
- 型定義の手動同期

### 14. READMEが不完全
環境構築手順が不明確

### 15. バンドルサイズ未最適化
Next.js の最適化余地あり

---

## 📋 すぐに実行可能なアクション

### 今日実施すべき
```bash
# 1. .env.example を作成
cat > .env.example << EOF
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mydatabase
SECRET_KEY=PLEASE_CHANGE_THIS_TO_LONG_RANDOM_STRING
APP_ENV=development
ALLOWED_EMAIL_DOMAIN=s.kyushu-u.ac.jp
ENABLE_EMAIL=false
EOF

# 2. 強力なSECRET_KEYを生成
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 今週実施すべき
1. Userモデルに `hashed_password` フィールド追加
2. パスワードハッシュ化ロジック実装
3. ログイン時のパスワード検証追加
4. Alembicマイグレーション作成

### 今月実施すべき
1. 認証システムをメール認証に統一
2. 基本的なテストを追加（最低10個）
3. Sentry統合
4. READMEを充実

---

## 📊 現在の状態

```
セキュリティ:  🔴🔴⚪⚪⚪⚪⚪⚪⚪⚪  30/100
テスト:        ⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪   0/100
コード品質:    🟢🟢🟢🟢🟢🟢🟡⚪⚪⚪  65/100
パフォーマンス:🟢🟢🟢🟢🟢🟢🟢⚪⚪⚪  70/100
ドキュメント:  🟢🟢🟢🟢🟢🟢⚪⚪⚪⚪  60/100

総合スコア: 46/100 🟡
```

---

## 🎯 ロードマップ

### Week 1: 緊急対応
- [x] Hydration Error 修正
- [x] ログアウトリダイレクト修正
- [ ] パスワード認証実装
- [ ] SECRET_KEY強化
- [ ] .env.example作成

### Week 2: セキュリティ強化
- [ ] バックエンドでメールドメイン検証
- [ ] ファイルアップロード検証強化
- [ ] 認証システム統一

### Week 3: テスト追加
- [ ] 認証APIテスト（10個）
- [ ] マッチングAPIテスト（5個）
- [ ] チャットAPIテスト（5個）

### Week 4: ドキュメント整備
- [ ] README更新
- [ ] API使用例追加
- [ ] トラブルシューティングガイド

---

## 💡 参考資料

詳細は以下を参照:
- `PROJECT_ISSUES_COMPREHENSIVE_REPORT.md` - 完全な問題レポート
- `HYDRATION_FIX_FINAL.md` - Hydration Error 修正
- `LOGOUT_REDIRECT_FIX.md` - ログアウト修正
- `DEPLOYMENT.md` - デプロイ手順

---

**最終更新**: 2025-10-27

