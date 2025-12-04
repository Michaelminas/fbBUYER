import { MetadataRoute } from 'next';
import { generateSitemapData } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemapData();
}