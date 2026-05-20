#!/bin/bash
# External Database URLを使用してマイグレーション実行

echo "📝 RenderダッシュボードからExternal Database URLをコピーしてください"
echo ""
echo "手順："
echo "1. Renderダッシュボード → qupid-db（またはqupid-db-v2）を選択"
echo "2. 'Info' タブを開く"
echo "3. 'External Database URL' をコピー"
echo ""
read -p "External Database URL を貼り付けてください: " EXTERNAL_URL

if [ -z "$EXTERNAL_URL" ]; then
    echo "❌ URLが入力されていません"
    exit 1
fi

# postgresql:// を postgresql+asyncpg:// に変換
ASYNCPG_URL="${EXTERNAL_URL/postgresql:\/\//postgresql+asyncpg:\/\/}"

echo ""
echo "🔄 マイグレーションを実行します..."
export DATABASE_URL="$ASYNCPG_URL"

cd /Users/shindokosuke/Qupid
alembic upgrade head

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ マイグレーション完了！"
    echo ""
    echo "次のステップ："
    echo "1. https://frontend-shindodesus-projects.vercel.app にアクセス"
    echo "2. 新規登録またはログインをテスト"
else
    echo ""
    echo "❌ エラーが発生しました"
    echo "データベースURLを確認してください"
fi
