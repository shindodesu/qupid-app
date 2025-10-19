import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, AuthProvider, QueryProvider } from "@/components/providers";
import { ToastContainer } from "@/components/common";
import { ErrorBoundary } from "@/components/common";

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
  description: "Qupidは、タグベースのマッチングシステムを採用した新しいマッチングアプリです。",
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Qupid',
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#E94057',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Qupid" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
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
