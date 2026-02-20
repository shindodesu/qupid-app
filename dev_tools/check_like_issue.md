# いいね送信エラー問題の調査ガイド

## 問題の概要
- いいね送信時に「いいねの送信に失敗しました」というエラーが表示される
- しかし、実際にはいいねは送信できている
- 送信している値と期待する値の間に差分がある可能性

## 確認すべきテーブル構造

### 1. **`likes`テーブル**（最重要）
いいねデータの基本構造を確認します。

**確認ポイント:**
- `id`: 主キー（INTEGER, AUTO_INCREMENT）
- `liker_id`: いいねを送ったユーザーID（INTEGER, NOT NULL, FOREIGN KEY → users.id）
- `liked_id`: いいねを受け取ったユーザーID（INTEGER, NOT NULL, FOREIGN KEY → users.id）
- `created_at`: いいね送信日時（TIMESTAMP/DATETIME, NOT NULL）
- 制約: `liker_id <> liked_id`（自分自身へのいいね不可）
- 制約: `(liker_id, liked_id)` のユニーク制約

**確認コマンド:**
```bash
# Docker Composeを使用している場合
docker-compose exec db psql -U user -d mydatabase -c "\d likes"

# またはPythonスクリプトを使用
python dev_tools/show_db_structure.py --table likes
```

### 2. **`users`テーブル**
レスポンスに含まれるユーザー情報の構造を確認します。

**確認ポイント（マッチング時のレスポンスに含まれるフィールド）:**
- `id`: ユーザーID
- `display_name`: 表示名
- `bio`: 自己紹介
- `faculty`: 学部
- `grade`: 学年
- `avatar_url`: アバターURL
- `campus`: キャンパス
- その他のプライバシー設定フィールド（`show_*`系）

**確認コマンド:**
```bash
docker-compose exec db psql -U user -d mydatabase -c "\d users"
```

### 3. **`blocks`テーブル**（関連）
ブロック状態のチェックに使用されます。

## 問題の原因候補

### 原因1: レスポンススキーマの不一致
`app/routers/likes.py`の127-143行目で、マッチング成立時のレスポンスに`match`フィールドを辞書形式で返していますが、`MatchRead`スキーマでは以下の構造が期待されています：

```python
class MatchRead(BaseModel):
    id: int
    user: UserWithTags  # 完全なUserWithTagsオブジェクトが必要
    matched_at: datetime  # このフィールドが欠けている可能性
```

**現在の実装:**
```python
match={
    "id": payload.liked_user_id,
    "user": {
        "id": liked_user.id,
        "display_name": liked_user.display_name,
        "bio": liked_user.bio,
        "faculty": liked_user.faculty,
        "grade": liked_user.grade,
    },
}
```

**問題点:**
1. `matched_at`フィールドが欠けている
2. `user`フィールドが`UserWithTags`の完全な形式ではない（一部のフィールドのみ）
3. `tags`フィールドが欠けている

### 原因2: データ型の不一致
- `created_at`の型が期待される形式と異なる可能性
- タイムゾーン情報の有無

### 原因3: NULL値の扱い
- オプショナルフィールドのNULL値が適切に処理されていない可能性

## 調査手順

### ステップ1: テーブル構造の確認
```bash
# likesテーブルの構造を確認
docker-compose exec db psql -U user -d mydatabase -c "\d likes"

# usersテーブルの構造を確認
docker-compose exec db psql -U user -d mydatabase -c "\d users"
```

### ステップ2: 実際のデータを確認
```bash
# 最新のいいねデータを確認
docker-compose exec db psql -U user -d mydatabase -c "
SELECT id, liker_id, liked_id, created_at 
FROM likes 
ORDER BY created_at DESC 
LIMIT 5;
"
```

### ステップ3: マッチングデータの確認
```bash
# マッチング成立しているペアを確認
docker-compose exec db psql -U user -d mydatabase -f dev_tools/check_like_schema.sql
```

### ステップ4: レスポンスの検証
バックエンドのログを確認して、実際に返されているレスポンスの構造を確認します。

## 実施した修正（フロントエンド）

- **いいね返信時の誤ったエラー表示**: 既にいいね済みのユーザーに再度いいねを送った場合（二重送信・表示遅延など）、バックエンドは 400 "You have already liked this user" を返すが、実際には1件目で送信は成功している。このためフロントエンドで「既にいいね済み」の 400 を成功扱いとする修正を行った。
  - **マッチページ**（`frontend/src/app/(dashboard)/matches/page.tsx`）: `handleLikeBack` の catch で、エラーメッセージに "already liked" / "既にいいね" が含まれる場合はアラートを出さず、受け取ったいいね一覧・マッチ一覧を再取得して次のカードへ進む。
  - **ホーム**（`frontend/src/app/(dashboard)/home/page.tsx`）: `handleLike` の catch で同様に「既にいいね済み」の場合はエラートーストを出さず、処理済みとして扱う。

## 推奨される修正（バックエンド・参考）

`app/routers/likes.py`の127-143行目を修正して、`MatchRead`スキーマに準拠したレスポンスを返すようにする必要があります（※既に `MatchRead` を用いた実装に更新済みの場合は不要）。

```python
# 修正前（現在の実装）
match={
    "id": payload.liked_user_id,
    "user": {
        "id": liked_user.id,
        "display_name": liked_user.display_name,
        "bio": liked_user.bio,
        "faculty": liked_user.faculty,
        "grade": liked_user.grade,
    },
}

# 修正後（推奨）
match=MatchRead(
    id=payload.liked_user_id,
    user=UserWithTags(...),  # 完全なUserWithTagsオブジェクト
    matched_at=max(new_like.created_at, reverse_like.created_at)
)
```

