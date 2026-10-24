import { siteUrl } from '@/lib/site';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/host', '/admin', '/login', '/api'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
