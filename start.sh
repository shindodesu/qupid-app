#!/bin/bash
# Render起動スクリプト - データベース接続をリトライしながらマイグレーションを実行

set -e

echo "🚀 Starting Qupid API..."

# データベース接続をリトライしながらマイグレーションを実行
MAX_RETRIES=10
RETRY_DELAY=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "🔄 Attempting database migration (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    
    if alembic upgrade head; then
        echo "✅ Database migration completed successfully!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⏳ Database connection failed. Retrying in ${RETRY_DELAY} seconds..."
            sleep $RETRY_DELAY
        else
            echo "❌ Database migration failed after $MAX_RETRIES attempts"
            echo "⚠️  Starting server anyway (migrations may need to be run manually)"
        fi
    fi
done

# サーバーを起動
echo "🌐 Starting Gunicorn server..."
exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --preload

