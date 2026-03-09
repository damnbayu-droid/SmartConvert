'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  ImageIcon,
  FileText,
  Archive,
  ChevronDown,
  Home,
  Menu,
  Globe,
} from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const imageTools = [
  { slug: 'image-to-webp', icon: ImageIcon },
  { slug: 'jpg-to-webp', icon: ImageIcon },
  { slug: 'png-to-webp', icon: ImageIcon },
  { slug: 'compress-image', icon: Archive },
];

export function AppSidebar({ locale }: { locale: string }) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <SidebarContainer>
      <SidebarContainer side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b border-border px-4 py-3">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">Smart Convert</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t('sidebar.allTools')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/${locale}`}
                  >
                    <Link href={`/${locale}`}>
                      <Home className="h-4 w-4" />
                      <span>{t('nav.home')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>{t('sidebar.imageConversion')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {imageTools.map((tool) => (
                  <SidebarMenuItem key={tool.slug}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.includes(tool.slug)}
                    >
                      <Link href={`/${locale}/tool/${tool.slug}`}>
                        <tool.icon className="h-4 w-4" />
                        <span>{t(`tools.${tool.slug.replace(/-/g, '')}.name`)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Globe className="h-4 w-4" />
                {localeNames[locale as Locale]}
                <ChevronDown className="h-4 w-4 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full">
              {locales.map((loc) => (
                <DropdownMenuItem key={loc} asChild>
                  <Link
                    href={pathname.replace(`/${locale}`, `/${loc}`)}
                    className="cursor-pointer"
                  >
                    {localeNames[loc]}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </SidebarContainer>

      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b border-border px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SidebarTrigger>
        </header>
        <main className="flex-1">{/* Content rendered by children */}</main>
      </SidebarInset>
    </SidebarContainer>
  );
}
