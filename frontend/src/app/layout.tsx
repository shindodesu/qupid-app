import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, AuthProvider, QueryProvider } from "@/components/providers";
import { ToastContainer } from "@/components/common";
import { ErrorBoundary } from "@/components/common";
import { PWALifecycle } from "@/components/common/PWALifecycle";
import { PWAEnhancer } from "@/components/common/PWAEnhancer";
import { PWAInstallPrompt } from "@/components/common/PWAInstallPrompt";
import { PWANavigationFix } from "@/components/common/PWANavigationFix";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qupid - マッチングアプリ",
  description: "Qupidは、九州大学のLGBTQ当事者学生のためのマッチングアプリです。",
  keywords: ["マッチング", "デート", "恋愛", "タグ", "マッチングアプリ"],
  authors: [{ name: "Qupid Team" }],
  creator: "Qupid",
  publisher: "Qupid",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://qupid.app"),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Qupid',
    startupImage: [
      {
        url: '/apple-icon.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: 'any' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "Qupid - マッチングアプリ",
    description: "Qupidは、タグベースのマッチングシステムを採用した新しいマッチングアプリです。",
    url: "https://qupid.app",
    siteName: "Qupid",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'Qupid Logo',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qupid - マッチングアプリ",
    description: "Qupidは、タグベースのマッチングシステムを採用した新しいマッチングアプリです。",
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Qupid" />
        <meta name="application-name" content="Qupid" />
        <meta name="msapplication-TileColor" content="#E94057" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-orientations" content="portrait" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-icon.png" />
        <link rel="apple-touch-startup-image" href="/apple-icon.png" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <PWALifecycle />
        <PWAEnhancer />
        <PWAInstallPrompt />
        <PWANavigationFix />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <QueryProvider>
              <AuthProvider>
                {children}
                <ToastContainer />
              </AuthProvider>
            </QueryProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
