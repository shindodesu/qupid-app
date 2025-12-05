# 📦 Render Starterプランでのファイルストレージ設定

## 🔍 現在の設定確認

### 静的ファイル配信の設定

`app/main.py` で以下の設定が行われています：

```python
# 静的ファイル提供（画像など）
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

**この設定は正しく動作しますが、RenderのStarterプランには制限があります。**

---

## ⚠️ Render Starterプランの制限

### 1. 一時的なファイルシステム（Ephemeral Storage）

**問題点:**
- RenderのStarterプランでは、ファイルシステムが**一時的（ephemeral）**です
- アプリケーションの再起動、デプロイ、またはスケーリング時に、`uploads` ディレクトリ内のファイルが**削除される可能性**があります
- ファイルは永続化されません

**影響:**
- ユーザーがアップロードした画像が、再起動後に404エラーになる
- アバター画像が消える
- メッセージの画像が消える

### 2. ディスク容量の制限

- Starterプランでは、ディスク容量に制限があります
- 大量の画像を保存すると、ディスク容量が不足する可能性があります

---

## 🔧 現在の設定の動作確認

### 確認方法

1. **アプリケーションのログを確認**
   - Renderダッシュボード → Logs
   - `/uploads` へのリクエストが正しく処理されているか確認

2. **静的ファイルへの直接アクセス**
   - `https://your-api.onrender.com/uploads/avatars/filename.jpg` に直接アクセス
   - 404エラーの場合、ファイルが存在しないか、パスが間違っている可能性があります

3. **ファイルの存在確認**
   - Renderのシェル機能（Starterプランでは利用できない場合があります）で確認
   - または、デバッグ用のエンドポイントを追加

---

## 🛠️ 推奨される解決策

### オプション1: 外部ストレージサービスの使用（推奨）

**AWS S3、Cloudinary、またはその他のオブジェクトストレージサービスを使用**

**メリット:**
- ファイルが永続化される
- スケーラブル
- CDNとの統合が容易
- コスト効率が良い

**実装例（Cloudinary）:**
```python
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name="your-cloud-name",
    api_key="your-api-key",
    api_secret="your-api-secret"
)

# アップロード
result = cloudinary.uploader.upload(file_content)
url = result['secure_url']  # https://res.cloudinary.com/...
```

### オプション2: Render Disk（有料プラン）

**RenderのDiskストレージを使用**

- Renderの有料プランでは、永続的なディスクストレージが利用可能
- 月額料金がかかりますが、設定が簡単

### オプション3: データベースにBase64エンコードして保存（小規模な画像のみ）

**注意**: データベースのサイズが大きくなるため、推奨されません

---

## 🔍 現在の404エラーの原因特定

### 確認すべき点

1. **ファイルが実際に存在するか**
   - アップロード時にファイルが正しく保存されているか
   - データベースに保存されている `avatar_url` のパスが正しいか

2. **静的ファイル配信の設定**
   - `app.mount("/uploads", ...)` が正しく動作しているか
   - パスが競合していないか（例: `/uploads` と `/files/upload` の競合）

3. **CORS設定**
   - `CORS_ORIGINS` にフロントエンドのURLが含まれているか

4. **ファイルパスの形式**
   - データベースに保存されているパス: `uploads/avatars/filename.jpg`
   - アクセスするURL: `https://api.onrender.com/uploads/avatars/filename.jpg`

---

## 📝 デバッグ用エンドポイントの追加（推奨）

ファイルの存在確認とデバッグのためのエンドポイントを追加することを推奨します：

```python
@router.get("/debug/uploads/{file_path:path}")
async def debug_file_exists(
    file_path: str,
    current_user: User = Depends(get_current_user),
):
    """デバッグ用: ファイルの存在確認"""
    full_path = UPLOAD_DIR / file_path
    exists = full_path.exists()
    return {
        "file_path": str(full_path),
        "exists": exists,
        "is_file": full_path.is_file() if exists else False,
        "size": full_path.stat().st_size if exists else 0,
    }
```

---

## 🚀 短期的な対策

### 1. ファイルの存在確認

アップロード時に、ファイルが正しく保存されているか確認するログを追加：

```python
# app/routers/files.py の upload_avatar 関数内
file_path = AVATAR_DIR / unique_filename

# ファイル保存
async with aiofiles.open(file_path, 'wb') as f:
    await f.write(file_content)

# 保存後の確認
if file_path.exists():
    print(f"✅ File saved: {file_path}, size: {file_path.stat().st_size}")
else:
    print(f"❌ File not saved: {file_path}")
```

### 2. エラーハンドリングの改善

静的ファイル配信でファイルが存在しない場合のエラーハンドリング：

```python
# app/main.py
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

try:
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except Exception as e:
    print(f"⚠️ Warning: Could not mount /uploads: {e}")
    # フォールバック: カスタムハンドラーを使用
```

---

## 📊 まとめ

### 現在の設定
- ✅ `app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")` は正しく設定されています
- ⚠️ RenderのStarterプランでは、ファイルが永続化されません

### 推奨される対応
1. **短期的**: デバッグログを追加して、ファイルの存在を確認
2. **長期的**: 外部ストレージサービス（S3、Cloudinaryなど）への移行を検討

### 確認事項
- [ ] アップロード時にファイルが正しく保存されているか
- [ ] データベースに保存されているパスが正しいか
- [ ] CORS設定が正しいか
- [ ] 静的ファイル配信が正しく動作しているか

---

## 🔗 関連ドキュメント

- [Render環境変数チェックリスト](RENDER_ENV_CHECKLIST.md)
- [本番環境セットアップガイド](PRODUCTION_SETUP.md)




