'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ImageIcon,
  FileArchive,
  ArrowRight,
  Zap,
  Shield,
  Upload,
  Globe,
  Smartphone,
} from 'lucide-react';

interface HeroSectionProps {
  locale: string;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const t = useTranslations();

  return (
    <section className="relative py-12 md:py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t('hero.title')}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground md:text-2xl">
          {t('hero.subtitle')}
        </p>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          {t('hero.description')}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href={`/${locale}/tool/image-to-webp`}>
              <Upload className="h-5 w-5" />
              {t('hero.cta.upload')}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href={`/${locale}/tool/image-to-webp`}>
              {t('hero.cta.convert')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Feature badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Upload className="h-5 w-5 text-primary" />
            <span>{t('hero.features.bulk')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-5 w-5 text-primary" />
            <span>{t('hero.features.fast')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5 text-primary" />
            <span>{t('hero.features.secure')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedTools({ locale }: HeroSectionProps) {
  const t = useTranslations();

  const tools = [
    {
      slug: 'image-to-webp',
      icon: ImageIcon,
      category: t('sidebar.imageConversion'),
      highlight: false,
    },
    {
      slug: 'heic-to-webp',
      icon: Smartphone,
      category: t('sidebar.imageConversion'),
      highlight: true,
    },
    {
      slug: 'compress-image',
      icon: FileArchive,
      category: t('sidebar.imageCompression'),
      highlight: false,
    },
  ];

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold text-center mb-8">
        {t('sidebar.allTools')}
      </h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tools.map((tool) => (
          <Link key={tool.slug} href={`/${locale}/tool/${tool.slug}`}>
            <Card className={`group hover:border-primary transition-colors cursor-pointer h-full ${tool.highlight ? 'border-primary/50 bg-primary/5' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`p-3 rounded-lg ${tool.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {tool.category}
                    </p>
                    <h3 className="font-semibold text-lg mt-1 group-hover:text-primary transition-colors">
                      {t(`tools.${tool.slug.replace(/-/g, '')}.name`)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t(`tools.${tool.slug.replace(/-/g, '')}.description`)}
                    </p>
                  </div>
                  {tool.highlight && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      NEW
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const t = useTranslations('tool');

  const steps = [
    { step: 1, title: t('step1'), icon: Upload },
    { step: 2, title: t('step2'), icon: Zap },
    { step: 3, title: t('step3'), icon: Globe },
  ];

  return (
    <section className="py-12 bg-muted/50">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-8">
          {t('howToUse')}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ step, title, icon: Icon }) => (
            <Card key={step}>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  {step}
                </div>
                <Icon className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="font-medium">{title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
