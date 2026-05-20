#!/bin/bash
# Render本番環境へのマイグレーション実行スクリプト

export DATABASE_URL="postgresql+asyncpg://user:BPSLwPXbF0SEcqwj8o6FJ3zUMZy6ETE5@dpg-d3njn6ruibrs738fctlg-a/mydaatabase"

echo "🔄 Render本番環境にマイグレーションを実行します..."
echo "DATABASE_URL: ${DATABASE_URL%%:*}://user:***@..." 

alembic upgrade head

echo "✅ マイグレーション完了！"
