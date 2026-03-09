'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqData = [
  {
    question: 'What is WebP format?',
    answer: 'WebP is a modern image format developed by Google that provides superior compression for images on the web. WebP images are 25-34% smaller than comparable JPEG images at equivalent quality, and can also support transparency like PNG files.',
  },
  {
    question: 'How much can I reduce image size?',
    answer: 'Our tool typically reduces image file size by 60-90% while maintaining high visual quality. The exact reduction depends on the original image format and content.',
  },
  {
    question: 'Is there a file size limit?',
    answer: 'Yes, the maximum file size is 100MB per image. You can upload up to 30 images at once for batch processing.',
  },
  {
    question: 'Are my images stored permanently?',
    answer: 'No, all uploaded files are automatically deleted after 1 hour. We prioritize your privacy and security.',
  },
  {
    question: 'Is this service free?',
    answer: 'Yes, Smart Convert is completely free to use. We process files in batches of 5, and you can continue processing by supporting our sponsor.',
  },
  {
    question: 'What is HEIC format?',
    answer: 'HEIC (High Efficiency Image Container) is the default image format used by Apple devices (iPhone, iPad). Our tool can convert HEIC images to WebP format directly in your browser.',
  },
];

export function ToolFAQ() {
  const t = useTranslations('tool');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold text-center mb-8">{t('faq')}</h2>
      <div className="max-w-3xl mx-auto space-y-2">
        {faqData.map((faq, index) => (
          <div
            key={index}
            className="border rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">{faq.question}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  openIndex === index && 'rotate-180'
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                openIndex === index ? 'max-h-96' : 'max-h-0'
              )}
            >
              <p className="p-4 pt-0 text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
