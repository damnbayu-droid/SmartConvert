'use client';

import dynamic from 'next/dynamic';

const ImageConverter = dynamic(() => import('@/components/image-converter').then(mod => mod.ImageConverter), {
  loading: () => <div className="h-64 flex items-center justify-center bg-muted/20 rounded-xl animate-pulse text-muted-foreground font-medium">Loading Image Tool...</div>,
  ssr: false
});

const VideoCompressor = dynamic(() => import('@/components/video-compressor').then(mod => mod.VideoCompressor), {
  loading: () => <div className="h-64 flex items-center justify-center bg-muted/20 rounded-xl animate-pulse text-muted-foreground font-medium">Preparing Video Engine...</div>,
  ssr: false
});

interface ToolWrapperProps {
  category: string;
  slug: string;
  locale: string;
}

export function ToolWrapper({ category, slug, locale }: ToolWrapperProps) {
  if (category === 'video-compression') {
    return <VideoCompressor />;
  }
  
  return <ImageConverter toolSlug={slug} locale={locale} />;
}
