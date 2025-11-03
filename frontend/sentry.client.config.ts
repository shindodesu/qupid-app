import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // 環境設定
  environment: process.env.NEXT_PUBLIC_APP_ENV || "development",
  
  // パフォーマンス監視
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // セッションリプレイ
  replaysSessionSampleRate: 0.1, // 10%のセッションを記録
  replaysOnErrorSampleRate: 1.0, // エラー発生時は100%記録
  
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // エラーフィルタリング
  beforeSend(event, hint) {
    // 開発環境ではSentryに送信しない
    if (process.env.NODE_ENV !== "production") {
      return null;
    }
    
    // 403エラー（権限エラー）は送信しない
    if (event.exception?.values?.[0]?.value?.includes("403")) {
      return null;
    }
    
    return event;
  },
  
  // エラーの無視設定
  ignoreErrors: [
    // ブラウザ拡張機能のエラー
    "top.GLOBALS",
    // ランダムなプラグインやアドオンのエラー
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    // 認証エラー（意図的な401/403）
    "401",
    "403",
  ],
});





