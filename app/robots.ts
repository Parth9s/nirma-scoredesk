import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/admin/dashboard/'], // Protect private routes from crawling
        },
        sitemap: 'https://strideee.in/sitemap.xml',
    }
}
