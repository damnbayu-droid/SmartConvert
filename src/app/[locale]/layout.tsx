import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Locale, locales } from '@/i18n/config';
import { Sidebar } from '@/components/sidebar';
import { MainWrapper } from '@/components/main-wrapper';

export const generateStaticParams = async () => {
  return locales.map((locale) => ({ locale }));
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return {
    title: {
      default: messages.metadata.title,
      template: `%s | Smart Convert`
    },
    description: messages.metadata.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en': '/en',
        'id': '/id'
      }
    }
  };
}

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
      <div className="flex min-h-screen">
        <Sidebar locale={locale} />
        {/* Main content with dynamic margin for sidebar handled by MainWrapper */}
        <MainWrapper>
          {children}
        </MainWrapper>
      </div>
    </NextIntlClientProvider>
  );
}
