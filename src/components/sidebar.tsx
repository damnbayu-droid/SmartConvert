'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ImageIcon,
  FileArchive,
  ChevronDown,
  Home,
  Globe,
  Smartphone,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Video,
  Info,
  LockOpen,
} from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n';
import { useState, useEffect, useRef } from 'react';
import { useSidebarStore } from '@/store/sidebar-store';
import { useUserStore } from '@/store/user-store';
import { EmailLockModal } from './email-lock-modal';

const imageTools = [
  { slug: 'image-to-webp', icon: ImageIcon, key: 'imagetowebp' },
  { slug: 'jpg-to-webp', icon: ImageIcon, key: 'jpgtowebp' },
  { slug: 'png-to-webp', icon: ImageIcon, key: 'pngtowebp' },
  { slug: 'heic-to-webp', icon: Smartphone, key: 'heictowebp' },
  { slug: 'compress-image', icon: FileArchive, key: 'compressimage' },
];

interface SidebarProps {
  locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const { email, checkAndResetDailyQuota } = useUserStore();

  useEffect(() => {
    checkAndResetDailyQuota();
  }, [checkAndResetDailyQuota]);

  // Track previous pathname to close mobile menu on navigation
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only close if pathname actually changed
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (mobileOpen) {
        // Use setTimeout to defer state update to next event loop
        const timer = setTimeout(() => setMobileOpen(false), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, mobileOpen]);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md">
              <Image src="/logo.webp" alt="Smart Convert" width={32} height={32} className="object-cover" />
            </div>
            <span className="font-semibold text-lg">Smart Convert</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={cn(collapsed && 'mx-auto', 'hidden lg:flex')}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-2">
          {/* Home */}
          <Link
            href={`/${locale}`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === `/${locale}`
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            <span className={cn(collapsed ? 'lg:hidden' : '')}>{t('nav.home')}</span>
          </Link>

          {/* Image Tools Section */}
          <div className={cn("mt-4 mb-2 px-3", collapsed ? "lg:hidden" : "")}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('sidebar.imageConversion')}
            </p>
          </div>

          {imageTools.slice(0, 4).map((tool) => (
            <Link
              key={tool.slug}
              href={`/${locale}/tool/${tool.slug}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname.includes(tool.slug)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <tool.icon className="h-4 w-4 flex-shrink-0" />
              <span className={cn(collapsed ? 'lg:hidden' : '')}>{t(`tools.${tool.key}.name`)}</span>
            </Link>
          ))}

          {/* Compression Section */}
          <div className={cn("mt-4 mb-2 px-3", collapsed ? "lg:hidden" : "")}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('sidebar.imageCompression')}
            </p>
          </div>

          {imageTools.slice(4).map((tool) => (
            <Link
              key={tool.slug}
              href={`/${locale}/tool/${tool.slug}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname.includes(tool.slug)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <tool.icon className="h-4 w-4 flex-shrink-0" />
              <span className={cn(collapsed ? 'lg:hidden' : '')}>{t(`tools.${tool.key}.name`)}</span>
            </Link>
          ))}

          {/* Video Tools Section */}
          <div className={cn("mt-4 mb-2 px-3", collapsed ? "lg:hidden" : "")}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('sidebar.videoTools')}
            </p>
          </div>

          <Link
            href={`/${locale}/tool/compress-video`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname.includes('compress-video')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            <Video className="h-4 w-4 flex-shrink-0" />
            <span className={cn(collapsed ? 'lg:hidden' : '')}>{t('tools.compressvideo.name')}</span>
          </Link>


          {/* Image Tools Link */}
          <Link
            href={`/${locale}/image-tools`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors mt-2',
              pathname.includes('image-tools')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            <ImageIcon className="h-4 w-4 flex-shrink-0" />
            <span className={cn(collapsed ? 'lg:hidden' : '')}>{t('nav.imageTools')}</span>
          </Link>

          {/* File Tools Link */}
          <Link
            href={`/${locale}/file-tools`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname.includes('file-tools')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            <FileArchive className="h-4 w-4 flex-shrink-0" />
            <span className={cn(collapsed ? 'lg:hidden' : '')}>{t('nav.fileTools')}</span>
          </Link>
        </nav>
      </ScrollArea>

      {/* Footer - Info & Language Selector */}
      <div className="border-t p-2">
        {!email && (
          <button
            onClick={() => setLockModalOpen(true)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-green-600 bg-green-500/10 hover:bg-green-500/20 font-medium transition-colors mb-2',
              collapsed && 'justify-center px-0'
            )}
          >
            <LockOpen className="h-4 w-4" />
            <div className={cn("flex w-full items-center", collapsed ? "lg:hidden" : "")}>
              <span className="ml-2">Unlock Full Access</span>
            </div>
          </button>
        )}

        {/* Info CTA */}
        <Link
          href={`/${locale}/info`}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2',
            collapsed && 'justify-center px-0'
          )}
        >
          <Info className="h-4 w-4" />
          <div className={cn("flex w-full items-center", collapsed ? "lg:hidden" : "")}>
            <span className="ml-2">{t('nav.info', { defaultMessage: 'Information' })}</span>
          </div>
        </Link>

        {/* Simple language selector without Radix to avoid hydration issues */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors',
              collapsed && 'justify-center px-0'
            )}
          >
            <Globe className="h-4 w-4" />
            <div className={cn("flex w-full items-center", collapsed ? "lg:hidden" : "")}>
              <span className="ml-2">{localeNames[locale as Locale]}</span>
              <ChevronDown className={cn('h-4 w-4 ml-auto transition-transform', langOpen && 'rotate-180')} />
            </div>
          </button>

          {langOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border bg-popover p-1 shadow-lg">
              {locales.map((loc) => (
                <Link
                  key={loc}
                  href={pathname.replace(`/${locale}`, `/${loc}`)}
                  onClick={() => setLangOpen(false)}
                  className={cn(
                    'flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-muted transition-colors',
                    loc === locale && 'bg-muted'
                  )}
                >
                  {localeNames[loc]}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {sidebarContent}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen border-r bg-background transition-all duration-300 lg:block',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {sidebarContent}
        </div>
      </aside>

      <EmailLockModal isOpen={lockModalOpen} onClose={() => setLockModalOpen(false)} />
    </>
  );
}
