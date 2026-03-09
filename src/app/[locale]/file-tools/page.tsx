import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Locale, locales } from '@/i18n/config';

export const runtime = 'edge';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FileArchive, ArrowRight } from 'lucide-react';

const fileTools = [
  {
    slug: 'pdf-compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    category: 'compression',
    comingSoon: true,
  },
  {
    slug: 'doc-to-pdf',
    name: 'DOC to PDF',
    description: 'Convert Word documents to PDF format',
    inputFormats: ['DOC', 'DOCX'],
    outputFormat: 'PDF',
    category: 'conversion',
    comingSoon: true,
  },
  {
    slug: 'xlsx-to-pdf',
    name: 'Excel to PDF',
    description: 'Convert Excel spreadsheets to PDF format',
    inputFormats: ['XLS', 'XLSX'],
    outputFormat: 'PDF',
    category: 'conversion',
    comingSoon: true,
  },
  {
    slug: 'ppt-to-pdf',
    name: 'PPT to PDF',
    description: 'Convert PowerPoint presentations to PDF format',
    inputFormats: ['PPT', 'PPTX'],
    outputFormat: 'PDF',
    category: 'conversion',
    comingSoon: true,
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return {
    title: 'File Tools - Smart Convert',
    description: 'Free online file conversion and compression tools. Compress PDFs, convert documents, and more.',
  };
}

export default async function FileToolsPage({
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
            <h1 className="text-3xl font-bold">File Tools</h1>
            <p className="text-muted-foreground mt-2">
              Free online file conversion and compression tools
            </p>
          </div>

          {/* Coming soon banner */}
          <Card className="mb-8 border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-600">
                  <FileArchive className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    File conversion tools are currently in development. Check back soon for PDF compression and document conversion features!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {fileTools.map((tool) => (
              <Card
                key={tool.slug}
                className={`group transition-colors h-full ${tool.comingSoon
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-primary cursor-pointer'
                  }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                      {tool.category === 'conversion' ? (
                        <FileText className="h-6 w-6" />
                      ) : (
                        <FileArchive className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-semibold text-lg">
                          {tool.name}
                        </h2>
                        <Badge variant="outline" className="text-xs">
                          {tool.category}
                        </Badge>
                        {tool.comingSoon && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
                            Coming Soon
                          </Badge>
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
                        <Badge className="text-xs bg-muted text-muted-foreground">
                          {tool.outputFormat}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
