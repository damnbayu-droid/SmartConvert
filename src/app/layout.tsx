import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://convert.biz.id"),
  title: {
    default: "Smart Convert | Secured and Free",
    template: "%s | Smart Convert"
  },
  description: "Free and secured file and image conversion tool. Convert images to WebP format with up to 90% size reduction.",
  keywords: ["image converter", "webp", "image compression", "bulk image converter", "free image tool", "secure file conversion"],
  authors: [{ name: "Smart Convert Team" }],
  icons: {
    icon: "/1.png",
    apple: "/1.png",
  },
  openGraph: {
    title: "Smart Convert | Secured and Free",
    description: "Free and secured file and image conversion tool. Convert images to WebP format with up to 90% size reduction.",
    siteName: "Smart Convert",
    url: "https://convert.biz.id",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Convert | Secured and Free",
    description: "Free and secured file and image conversion tool. Convert images to WebP format with up to 90% size reduction.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Note: next-intl recommends moving <html> inside [locale]/layout.tsx for dynamic language, 
    // but without restructuring, this will be static. Next-intl's NextIntlClientProvider handles locale loading client-side.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <NextTopLoader
          color="#18181b"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2299DD,0 0 5px #2299DD"
          template='<div class="bar" role="bar"><div class="peg"></div></div> 
          <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
          zIndex={1600}
          showAtBottom={false}
        />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
