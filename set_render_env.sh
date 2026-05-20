#!/bin/bash

# Renderサービス環境変数設定スクリプト
# 使い方: ./set_render_env.sh <service-id>
# サービスIDはRenderのURLから取得: srv-xxxxxxxxxx

SERVICE_ID=$1

if [ -z "$SERVICE_ID" ]; then
  echo "使い方: ./set_render_env.sh <service-id>"
  echo "例: ./set_render_env.sh srv-d3njsgjuibrs738fhno0"
  echo ""
  echo "サービスIDはRenderのダッシュボードURLから確認できます:"
  echo "https://dashboard.render.com/web/srv-xxxxxxxxxx/settings"
  exit 1
fi

echo "🚀 Renderサービス: $SERVICE_ID の環境変数を設定しています..."

# 環境変数を設定
render env set APP_NAME="Qupid API" --service-id=$SERVICE_ID
render env set APP_ENV="production" --service-id=$SERVICE_ID
render env set SECRET_KEY="ZOMCYJE9jWgY3owEDZ-XoRHku6jBiOHInPwaTr9YgJI" --service-id=$SERVICE_ID
render env set ACCESS_TOKEN_EXPIRE_MINUTES="10080" --service-id=$SERVICE_ID
render env set ALLOWED_EMAIL_DOMAIN="s.kyushu-u.ac.jp" --service-id=$SERVICE_ID

# メール設定
render env set ENABLE_EMAIL="true" --service-id=$SERVICE_ID
render env set SMTP_SERVER="smtp.gmail.com" --service-id=$SERVICE_ID
render env set SMTP_PORT="587" --service-id=$SERVICE_ID
render env set SMTP_USERNAME="qudai.qupid@gmail.com" --service-id=$SERVICE_ID
render env set FROM_EMAIL="qudai.qupid@gmail.com" --service-id=$SERVICE_ID

# リトライ・レート制限設定
render env set EMAIL_MAX_RETRIES="3" --service-id=$SERVICE_ID
render env set EMAIL_RETRY_DELAY="2" --service-id=$SERVICE_ID
render env set EMAIL_RATE_LIMIT_PER_HOUR="10" --service-id=$SERVICE_ID
render env set API_RATE_LIMIT_PER_MINUTE="100" --service-id=$SERVICE_ID

echo ""
echo "⚠️  以下の環境変数は手動で設定してください:"
echo ""
echo "1. SMTP_PASSWORD（Gmailアプリパスワード）:"
echo "   render env set SMTP_PASSWORD=\"your-app-password\" --service-id=$SERVICE_ID"
echo ""
echo "2. DATABASE_URL（postgresql:// → postgresql+asyncpg:// に変更）:"
echo "   render env set DATABASE_URL=\"postgresql+asyncpg://user:password@host/db\" --service-id=$SERVICE_ID"
echo ""
echo "✅ 環境変数の設定が完了しました！"
echo "📋 確認: render env list --service-id=$SERVICE_ID"

