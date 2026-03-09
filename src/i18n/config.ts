export const locales = ['en', 'id'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia'
};

export const localePaths: Record<string, Record<Locale, string>> = {
  'image-to-webp': {
    en: 'image-to-webp',
    id: 'gambar-ke-webp'
  },
  'jpg-to-webp': {
    en: 'jpg-to-webp',
    id: 'jpg-ke-webp'
  },
  'png-to-webp': {
    en: 'png-to-webp',
    id: 'png-ke-webp'
  },
  'compress-image': {
    en: 'compress-image',
    id: 'kompres-gambar'
  }
};
