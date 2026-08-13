import { locales } from '@/i18n/config';
import { HeroSection, FeaturedTools, HowItWorks } from '@/components/hero-section';
import { ToolFAQ } from '@/components/tool-faq';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4">
          <HeroSection locale={locale} />
          <FeaturedTools locale={locale} />
        </div>
        <HowItWorks />
        <div className="container mx-auto px-4">
          <ToolFAQ />
        </div>
      </main>
    </div>
  );
}
