'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations('footer');

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t('copyright')}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}/privacy`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('privacy')}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('terms')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
