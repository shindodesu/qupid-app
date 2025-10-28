import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // 環境設定
  environment: process.env.NEXT_PUBLIC_APP_ENV || "development",
  
  // パフォーマンス監視
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // エラーフィルタリング
  beforeSend(event, hint) {
    // 開発環境ではSentryに送信しない
    if (process.env.NODE_ENV !== "production") {
      return null;
    }
    
    return event;
  },
  
  // エラーの無視設定
  ignoreErrors: [
    // 認証エラー（意図的な401/403）
    "401",
    "403",
  ],
});



