import { MetadataRoute } from 'next';

const DOMAIN = 'https://convert.biz.id';

export default function sitemap(): MetadataRoute.Sitemap {
    const tools = [
        'image-to-webp',
        'jpg-to-webp',
        'png-to-webp',
        'heic-to-webp',
        'compress-image',
    ];

    const locales = ['en', 'id'];

    const pages: MetadataRoute.Sitemap = locales.flatMap((locale) => {
        const baseRoutes: MetadataRoute.Sitemap = [
            {
                url: `${DOMAIN}/${locale}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 1,
            },
            ...tools.map((tool) => ({
                url: `${DOMAIN}/${locale}/tool/${tool}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.9,
            })),
            {
                url: `${DOMAIN}/${locale}/image-tools`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.8,
            },
            {
                url: `${DOMAIN}/${locale}/file-tools`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.8,
            },
        ];

        return baseRoutes;
    });

    // Always include the root site base URL directly defaulting to english standard routing (optional standard but robust)
    pages.push({
        url: `${DOMAIN}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
    });

    return pages;
}
