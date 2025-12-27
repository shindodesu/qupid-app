# SQLAlchemyのExpired Object（期限切れオブジェクト）エラーについて

## 📋 問題の概要

いいね送信時に以下のエラーが発生していました：

```
sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called; can't call await_only() here. 
Was IO attempted in an unexpected place?
```

エラーが発生した箇所：
```python
File "/app/app/routers/likes.py", line 149, in send_like
    if not liked_user.show_tags:
           ^^^^^^^^^^^^^^^^^^^^
```

## 🔍 原因の詳細

### 1. Expired Object（期限切れオブジェクト）とは

SQLAlchemyでは、データベースから取得したオブジェクトは、**セッションがコミットされた後、自動的にexpired（期限切れ）状態**になります。

**なぜexpiredになるのか？**
- コミット後、他のトランザクションやプロセスによってデータが変更される可能性がある
- 最新の状態を保証するため、次回アクセス時に再取得する必要がある
- これにより、データの整合性を保つことができる

### 2. 非同期セッションでの問題

**同期セッション（通常のSQLAlchemy）の場合：**
```python
# 同期セッションでは、expired属性にアクセスすると自動的に再取得される
user = session.get(User, user_id)
session.commit()  # この後、userはexpiredになる
print(user.name)  # 自動的に再取得される（同期的に）
```

**非同期セッション（AsyncSession）の場合：**
```python
# 非同期セッションでは、expired属性にアクセスすると非同期クエリが必要
user = await db.get(User, user_id)
await db.commit()  # この後、userはexpiredになる
print(user.name)  # 非同期クエリが必要だが、適切なコンテキストがないとエラー
```

### 3. 今回のケースでの問題の流れ

```python
# 1. ユーザーを取得
liked_user = await db.get(User, payload.liked_user_id)

# 2. いいねを作成してコミット
db.add(new_like)
await db.commit()  # ← この時点でliked_userがexpiredになる

# 3. マッチング判定など...

# 4. タグ情報を取得
user_tags = user_tags_query.scalars().all()

# 5. ここでliked_user.show_tagsにアクセスしようとする
if not liked_user.show_tags:  # ← エラー発生！
    tags = []
```

**問題点：**
- `await db.commit()`の後、`liked_user`オブジェクトがexpired状態になる
- その後、`liked_user.show_tags`にアクセスしようとすると、SQLAlchemyは自動的に再取得を試みる
- しかし、非同期セッションでは`greenlet`コンテキストが必要
- 適切なコンテキストがないため、`MissingGreenlet`エラーが発生

## ✅ 解決方法

### 方法1: コミット後に明示的にリフレッシュ（推奨）

```python
# いいねを作成
new_like = Like(
    liker_id=current_user_id,
    liked_id=payload.liked_user_id,
)
db.add(new_like)
await db.commit()
await db.refresh(new_like)

# コミット後にliked_userがexpiredになるのを防ぐため、明示的にリフレッシュ
await db.refresh(liked_user)  # ← 追加
```

**メリット：**
- シンプルで明確
- オブジェクトを最新の状態に保つ
- 後続の属性アクセスでエラーが発生しない

### 方法2: 必要な属性を事前に取得

```python
# ユーザーを取得した直後に、必要な属性を変数に保存
liked_user = await db.get(User, payload.liked_user_id)
if not liked_user:
    raise HTTPException(...)

# 必要な属性を事前に取得
show_tags = liked_user.show_tags
show_bio = liked_user.show_bio
# ... 他の必要な属性も同様に

# コミット後も、変数に保存した値を使用
if not show_tags:
    tags = []
```

**メリット：**
- リフレッシュが不要
- パフォーマンスが良い（追加のクエリが不要）

**デメリット：**
- コードが冗長になる可能性がある
- 属性が多い場合、管理が大変

### 方法3: コミット前に必要な属性にアクセス

```python
# ユーザーを取得
liked_user = await db.get(User, payload.liked_user_id)

# コミット前に必要な属性にアクセス（これにより、属性がロードされる）
_ = liked_user.show_tags  # 属性にアクセスしてロード
_ = liked_user.show_bio
# ... 他の必要な属性も同様に

# その後、コミット
db.add(new_like)
await db.commit()
```

**メリット：**
- リフレッシュが不要
- 属性が確実にロードされる

**デメリット：**
- コードが冗長になる
- 意図が不明確

## 📊 比較表

| 方法 | メリット | デメリット | 推奨度 |
|------|---------|-----------|--------|
| 方法1: リフレッシュ | シンプル、明確 | 追加のクエリが必要 | ⭐⭐⭐ |
| 方法2: 事前取得 | パフォーマンスが良い | コードが冗長 | ⭐⭐ |
| 方法3: 事前アクセス | リフレッシュ不要 | 意図が不明確 | ⭐ |

## 🎯 実装例（修正後）

```python
# app/routers/likes.py

# 相手ユーザーの存在確認
liked_user = await db.get(User, payload.liked_user_id)
if not liked_user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found",
    )

# ... ブロックチェック、既存のいいねチェック ...

# いいねを作成
new_like = Like(
    liker_id=current_user_id,
    liked_id=payload.liked_user_id,
)
db.add(new_like)
await db.commit()
await db.refresh(new_like)

# コミット後にliked_userがexpiredになるのを防ぐため、明示的にリフレッシュ
await db.refresh(liked_user)  # ← これにより、後続の属性アクセスが安全になる

# マッチング判定
reverse_like = reverse_like_query.scalar_one_or_none()
is_match = reverse_like is not None

if is_match:
    # タグ情報を取得
    user_tags = user_tags_query.scalars().all()
    
    tags = [...]
    
    # ここでliked_user.show_tagsにアクセスしてもエラーが発生しない
    if not liked_user.show_tags:  # ← 安全にアクセスできる
        tags = []
```

## 🔑 重要なポイント

### 1. コミット後のオブジェクト状態

```python
await db.commit()
# この時点で、セッション内のすべてのオブジェクトがexpiredになる可能性がある
```

### 2. 非同期セッションでの注意点

- 非同期セッションでは、expired属性へのアクセスが非同期クエリを必要とする
- 適切なコンテキスト（greenlet）がないと、`MissingGreenlet`エラーが発生
- `await db.refresh()`を使用することで、明示的にリフレッシュできる

### 3. ベストプラクティス

1. **コミット後にオブジェクトを使用する場合は、必ずリフレッシュする**
2. **または、必要な属性を事前に変数に保存する**
3. **非同期セッションでは、expired属性へのアクセスに注意する**

## 📚 参考資料

- [SQLAlchemy AsyncSession Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [SQLAlchemy Expired Object Error](https://sqlalche.me/e/20/xd2s)
- [SQLAlchemy Session Expiration](https://docs.sqlalchemy.org/en/20/orm/session_state_management.html#expiring)

## 🧪 テスト方法

修正後、以下のテストを実行して確認：

1. いいね送信をテスト（マッチング成立時）
2. いいね送信をテスト（通常のいいね）
3. エラーログを確認して、`MissingGreenlet`エラーが発生しないことを確認

## 💡 まとめ

- **原因**: `await db.commit()`後にオブジェクトがexpiredになり、非同期セッションで属性アクセス時に`MissingGreenlet`エラーが発生
- **解決**: `await db.refresh(liked_user)`を追加して、コミット後にオブジェクトを明示的にリフレッシュ
- **教訓**: 非同期セッションでは、コミット後のオブジェクト使用に注意し、必要に応じてリフレッシュする

