import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qupid.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/auth/',
          '/home',
          '/search',
          '/matches',
          '/chat',
          '/profile',
          '/safety',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

