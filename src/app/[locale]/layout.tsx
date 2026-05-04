import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Locale, locales } from '@/i18n/config';
import { Sidebar } from '@/components/sidebar';
import { MainWrapper } from '@/components/main-wrapper';
import { AdsProvider } from '@/components/ads-provider';
import { Toaster } from '@/components/ui/sonner';

export const generateStaticParams = async () => {
  return locales.map((locale) => ({ locale }));
};

export const dynamic = 'auto';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    return {};
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://convert.biz.id'),
    title: {
      default: messages.metadata.title,
      template: `%s | Smart Convert`
    },
    description: messages.metadata.description,
    manifest: '/manifest.webmanifest',
    icons: {
      icon: '/Favicon.webp',
      apple: '/app-icon.webp',
    },
    openGraph: {
      title: messages.metadata.title,
      description: messages.metadata.description,
      url: 'https://convert.biz.id',
      siteName: 'PT Indonesian Visas Agency',
      images: [
        {
          url: '/og-image.webp',
          width: 1200,
          height: 630,
          alt: 'PT Indonesian Visas Agency',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: messages.metadata.title,
      description: messages.metadata.description,
      images: ['/og-image.webp'],
    },
    alternates: {
      canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://convert.biz.id',
      languages: {
        'en': '/en',
        'id': '/id'
      }
    }
  };
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AdsProvider>
        <div className="flex min-h-screen">
          <Sidebar locale={locale} />
          {/* Main content with dynamic margin for sidebar handled by MainWrapper */}
          <MainWrapper>
            {children}
          </MainWrapper>
        </div>
        <Toaster position="top-center" richColors />
      </AdsProvider>
    </NextIntlClientProvider>
  );
}
