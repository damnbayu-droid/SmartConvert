'use client';

import { useSidebarStore } from '@/store/sidebar-store';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MainWrapperProps {
    children: ReactNode;
}

export function MainWrapper({ children }: MainWrapperProps) {
    const collapsed = useSidebarStore((state) => state.collapsed);

    return (
        <main
            className={cn(
                'flex-1 transition-all duration-300 w-full lg:max-w-none',
                collapsed ? 'lg:ml-16' : 'lg:ml-64'
            )}
        >
            {children}
        </main>
    );
}
