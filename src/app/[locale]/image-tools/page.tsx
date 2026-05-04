import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Locale, locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const dynamicParams = false;


import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, FileArchive, Smartphone, ArrowRight } from 'lucide-react';

const imageTools = [
  {
    slug: 'image-to-webp',
    name: 'Image to WebP',
    description: 'Convert any image format to WebP with high quality compression',
    inputFormats: ['JPG', 'JPEG', 'PNG', 'WEBP', 'HEIC'],
    outputFormat: 'WEBP',
    category: 'conversion',
  },
  {
    slug: 'jpg-to-webp',
    name: 'JPG to WebP',
    description: 'Convert JPG images to WebP format',
    inputFormats: ['JPG', 'JPEG'],
    outputFormat: 'WEBP',
    category: 'conversion',
  },
  {
    slug: 'png-to-webp',
    name: 'PNG to WebP',
    description: 'Convert PNG images to WebP while preserving transparency',
    inputFormats: ['PNG'],
    outputFormat: 'WEBP',
    category: 'conversion',
  },
  {
    slug: 'heic-to-webp',
    name: 'HEIC to WebP',
    description: 'Convert HEIC/HEIF images from iPhone to WebP format',
    inputFormats: ['HEIC', 'HEIF'],
    outputFormat: 'WEBP',
    category: 'conversion',
    highlight: true,
  },
  {
    slug: 'compress-image',
    name: 'Compress Image',
    description: 'Reduce image file size while maintaining quality',
    inputFormats: ['JPG', 'JPEG', 'PNG', 'WEBP', 'HEIC'],
    outputFormat: 'Same as input',
    category: 'compression',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return {
    title: 'Image Tools - Smart Convert',
    description: 'Free online image conversion and compression tools. Convert images to WebP, compress images, HEIC support and more.',
  };
}

export default async function ImageToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Image Tools</h1>
            <p className="text-muted-foreground mt-2">
              Free online image conversion and compression tools
            </p>
          </div>

          {/* HEIC Highlight Banner */}
          <Card className="mb-8 border-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">NEW: HEIC to WebP Support!</h3>
                  <p className="text-sm text-muted-foreground">
                    Convert iPhone photos (HEIC/HEIF) to WebP format directly in your browser
                  </p>
                </div>
                <Link href={`/${locale}/tool/heic-to-webp`}>
                  <Badge className="cursor-pointer">Try Now</Badge>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tools grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {imageTools.map((tool) => (
              <Link key={tool.slug} href={`/${locale}/tool/${tool.slug}`}>
                <Card className={`group hover:border-primary transition-colors cursor-pointer h-full ${tool.highlight ? 'border-primary/50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${tool.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        {tool.slug === 'heic-to-webp' ? (
                          <Smartphone className="h-6 w-6" />
                        ) : tool.category === 'conversion' ? (
                          <ImageIcon className="h-6 w-6" />
                        ) : (
                          <FileArchive className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {tool.name}
                          </h2>
                          <Badge variant="secondary" className="text-xs">
                            {tool.category}
                          </Badge>
                          {tool.highlight && (
                            <Badge className="text-xs">Popular</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {tool.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {tool.inputFormats.map((format) => (
                            <Badge key={format} variant="outline" className="text-xs">
                              {format}
                            </Badge>
                          ))}
                          <span className="text-muted-foreground text-xs">→</span>
                          <Badge className="text-xs bg-primary text-primary-foreground">
                            {tool.outputFormat}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
