'use client';

import { useEffect } from 'react';

export function PWAEnhancer() {
  useEffect(() => {
    // PWAの表示モードを強制
    const enhancePWA = () => {
      // iOS Safari での PWA 表示を改善
      if ('standalone' in window.navigator && (window.navigator as any).standalone === false) {
        // ブラウザ内で実行されている場合の処理
        const meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-capable';
        meta.content = 'yes';
        document.head.appendChild(meta);
      }

      // フルスクリーン表示の強制
      if (document.fullscreenEnabled) {
        // 必要に応じてフルスクリーンモードを有効化
        // document.documentElement.requestFullscreen();
      }

      // ビューポートの調整
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        );
      }

      // ステータスバーのスタイル調整
      const statusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBarStyle) {
        statusBarStyle.setAttribute('content', 'black-translucent');
      }
    };

    // ページロード時に実行
    enhancePWA();

    // ページ遷移時にも実行
    const handleRouteChange = () => {
      setTimeout(enhancePWA, 100);
    };

    // ページの可視性が変わった時にも実行
    document.addEventListener('visibilitychange', enhancePWA);
    
    // リサイズ時にも実行
    window.addEventListener('resize', enhancePWA);

    return () => {
      document.removeEventListener('visibilitychange', enhancePWA);
      window.removeEventListener('resize', enhancePWA);
    };
  }, []);

  return null;
}
