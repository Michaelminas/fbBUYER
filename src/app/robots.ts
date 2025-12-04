import { MetadataRoute } from 'next';
import { generateRobotsTxt } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const robotsContent = generateRobotsTxt();
  
  // Parse the text format into the expected structure
  const lines = robotsContent.split('\n');
  const rules = {
    userAgent: '*',
    allow: ['/'],
    disallow: ['/admin/', '/api/', '/verify/', '/_next/'],
  };
  
  const sitemapLine = lines.find(line => line.startsWith('Sitemap:'));
  const sitemap = sitemapLine ? sitemapLine.replace('Sitemap: ', '') : undefined;

  return {
    rules,
    sitemap,
    host: 'https://sellphones.sydney'
  };
}