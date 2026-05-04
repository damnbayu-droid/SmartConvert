import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Locale, locales, localePaths } from '@/i18n/config';
import { ToolWrapper } from '@/components/tool-wrapper';
import { ToolFAQ } from '@/components/tool-faq';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Image as ImageIcon, FileArchive, Video } from 'lucide-react';

// Tool definitions
const tools: Record<string, {
  name: string;
  description: string;
  inputFormats: string[];
  outputFormat: string;
  category: string;
}> = {
  'image-to-webp': {
    name: 'Image to WebP',
    description: 'Convert JPG, PNG, HEIC, and other image formats to WebP with high quality compression. Reduce file size by up to 90%.',
    inputFormats: ['JPG', 'JPEG', 'PNG', 'WEBP', 'HEIC', 'HEIF'],
    outputFormat: 'WEBP',
    category: 'image-conversion',
  },
  'gambar-ke-webp': {
    name: 'Gambar ke WebP',
    description: 'Konversi JPG, PNG, HEIC, dan format gambar lainnya ke WebP dengan kompresi berkualitas tinggi.',
    inputFormats: ['JPG', 'JPEG', 'PNG', 'WEBP', 'HEIC', 'HEIF'],
    outputFormat: 'WEBP',
    category: 'image-conversion',
  },
  'jpg-to-webp': {
    name: 'JPG to WebP',
    description: 'Convert JPG images to WebP format with excellent compression.',
    inputFormats: ['JPG', 'JPEG'],
    outputFormat: 'WEBP',
    category: 'image-conversion',
  },
  'png-to-webp': {
    name: 'PNG to WebP',
    description: 'Convert PNG images to WebP while preserving transparency.',
    inputFormats: ['PNG'],
    outputFormat: 'WEBP',
    category: 'image-conversion',
  },
  'heic-to-webp': {
    name: 'HEIC to WebP',
    description: 'Convert HEIC/HEIF images from iPhone to WebP format. Works with all Apple device photos.',
    inputFormats: ['HEIC', 'HEIF'],
    outputFormat: 'WEBP',
    category: 'image-conversion',
  },
  'compress-image': {
    name: 'Compress Image',
    description: 'Reduce image file size while maintaining quality.',
    inputFormats: ['JPG', 'JPEG', 'PNG', 'WEBP', 'HEIC'],
    outputFormat: 'Same as input',
    category: 'image-compression',
  },
  'compress-video': {
    name: 'Compress Video Online',
    description: 'Compress video online for free. Reduce MP4 file size while keeping high quality. Supports H264 and WebM optimization.',
    inputFormats: ['MP4', 'MOV', 'MKV', 'WEBM', 'AVI'],
    outputFormat: 'MP4 / WebM',
    category: 'video-compression',
  },
};

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    for (const [slug] of Object.entries(tools)) {
      params.push({ locale, slug });
    }
  }

  return params;
}



export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });
  const tool = tools[slug];

  if (!tool) {
    return {
      title: 'Tool Not Found',
    };
  }

  return {
    title: `${tool.name} - Free Online Converter`,
    description: tool.description,
    openGraph: {
      title: `${tool.name} | Smart Convert`,
      description: tool.description,
      type: 'website',
    },
    alternates: {
      canonical: `/${locale}/tool/${slug}`,
      languages: {
        'en': `/en/tool/${slug}`,
        'id': `/id/tool/${slug}`,
      },
    },
  };
}

// Generate JSON-LD structured data
function generateStructuredData(tool: typeof tools[string], slug: string, locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://convert.biz.id';

  // Corporate Hierarchy Schema
  const corporateSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://bali.enterprises',
    name: 'Bali Enterprises',
    url: 'https://bali.enterprises',
    subOrganization: {
      '@type': 'Organization',
      '@id': 'https://indonesianvisas.com',
      name: 'PT Indonesian Visas Agency',
      url: 'https://indonesianvisas.com',
      parentOrganization: { '@id': 'https://bali.enterprises' },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          email: 'smart@notes.biz.id',
          contactType: 'customer service'
        },
        {
          '@type': 'ContactPoint',
          email: 'info@bali.enterprises',
          contactType: 'corporate communication'
        }
      ]
    }
  };

  // SoftwareApplication schema (The Product)
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Smart Convert - ${tool.name}`,
    description: tool.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web Browser',
    author: {
      '@type': 'Organization',
      name: 'PT Indonesian Visas Agency',
      parentOrganization: {
        '@type': 'Organization',
        name: 'Bali Enterprises'
      }
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    }
  };

  // Breadcrumb Schema for Maximum SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/${locale}`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tool.category,
        item: `${baseUrl}/${locale}/${tool.category.includes('image') ? 'image-tools' : 'file-tools'}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: tool.name,
        item: `${baseUrl}/${locale}/tool/${slug}`
      }
    ]
  };

  return [corporateSchema, softwareSchema, breadcrumbSchema];
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tool = tools[slug];

  if (!tool) {
    notFound();
  }

  // Get related tools
  const relatedTools = Object.entries(tools)
    .filter(([s]) => s !== slug && tools[s].category === tool.category)
    .slice(0, 3);

  // Generate structured data
  const structuredData = generateStructuredData(tool, slug, locale);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData[0]) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData[1]) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData[2]) }}
      />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Back link */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          {/* Tool header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold">{tool.name}</h1>
              <Badge variant="secondary">Free</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {tool.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {tool.inputFormats.map((format) => (
                <Badge key={format} variant="outline">
                  {format}
                </Badge>
              ))}
              <span className="text-muted-foreground">→</span>
              <Badge className="bg-primary text-primary-foreground">
                {tool.outputFormat}
              </Badge>
            </div>
          </div>

          {/* Converter */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 min-h-[400px]">
              <ToolWrapper 
                category={tool.category} 
                slug={slug} 
                locale={locale} 
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How to use */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload your images (JPG, PNG, or WebP)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adjust quality settings if needed
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Download your converted WebP files
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Related tools */}
              {relatedTools.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relatedTools.map(([relatedSlug, relatedTool]) => (
                      <Link
                        key={relatedSlug}
                        href={`/${locale}/tool/${relatedSlug}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {relatedTool.category === 'image-conversion' ? (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <FileArchive className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="font-medium">{relatedTool.name}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <ToolFAQ />
          </div>
        </div>
      </main>
    </div>
  );
}
