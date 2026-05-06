import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/agent/', '/api/'],
      },
    ],
    sitemap: 'https://telenor.jensnic.no/sitemap.xml',
  }
}
