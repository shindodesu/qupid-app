import type { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
}

const APP_NAME = 'Qupid'
const APP_DESCRIPTION = 'Qupidは、九州大学のLGBTQ+当事者学生が安全で快適にマッチングできるアプリです。'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://qupid.app'

/**
 * SEO用のメタデータを生成
 */
export function generateSEO({
  title,
  description = APP_DESCRIPTION,
  image = '/icon.png',
  noIndex = false,
}: SEOProps = {}): Metadata {
  const pageTitle = title ? `${title} | ${APP_NAME}` : APP_NAME

  return {
    title: pageTitle,
    description,
    applicationName: APP_NAME,
    keywords: [
      'マッチングアプリ',
      'LGBTQ+',
      '九州大学',
      '学生',
      '安全',
      'タグベース',
    ],
    authors: [{ name: 'Qupid Team' }],
    creator: 'Qupid',
    publisher: 'Qupid',
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: pageTitle,
      description,
      url: APP_URL,
      siteName: APP_NAME,
      images: [
        {
          url: image,
          width: 512,
          height: 512,
          alt: `${APP_NAME} Logo`,
        },
      ],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [image],
      creator: '@qupid',
    },
  }
}

/**
 * JSON-LD構造化データを生成
 */
export function generateJSONLD(type: 'WebSite' | 'WebApplication' = 'WebApplication') {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    applicationCategory: 'SocialNetworking',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
  }

  return baseData
}

