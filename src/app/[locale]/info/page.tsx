import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Zap, Image as ImageIcon, Video, FileArchive, ServerOff, Smartphone } from 'lucide-react';



export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `Information & Features`,
    description: 'Learn about all the features and capabilities of Smart Convert. Fast, private, browser-side file conversion.',
  };
}

export default function InfoPage() {
  const t = useTranslations();

  return (
    <div className="container max-w-4xl py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto px-4 md:px-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
          About Smart Convert
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The ultimate, privacy-first conversion platform. We bring state-of-the-art WebAssembly technology directly to your browser for completely secure, blazing-fast file transformations.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <Shield className="h-8 w-8 text-primary mb-2" />
            <CardTitle>100% Private & Secure</CardTitle>
            <CardDescription>Your files never leave your device.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            Unlike traditional converters that force you to upload your sensitive files to their servers, Smart Convert utilizes <strong className="text-foreground">Browser-Side Processing</strong>. Your images and videos are processed entirely using your own device's CPU and memory. We never see, store, or have access to your files.
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <Zap className="h-8 w-8 text-yellow-500 mb-2" />
            <CardTitle>Lightning Fast</CardTitle>
            <CardDescription>No upload or download wait times.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            By running directly in your browser, we eliminate the network bottleneck. There is zero upload or download time. As soon as you select a file, our highly optimized WebAssembly (WASM) engines start processing it instantly, delivering results faster than any cloud-based solution.
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-6 text-center">Core Functions & Features</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <ImageIcon className="h-6 w-6 text-blue-500 mb-2" />
            <CardTitle className="text-lg">Image Conversion</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Convert JPG, PNG, and WebP instantly using the native Canvas API. Reduces file sizes drastically while maintaining pixel-perfect quality. Perfect for SEO optimization.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Smartphone className="h-6 w-6 text-pink-500 mb-2" />
            <CardTitle className="text-lg">HEIC Support</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Native support for Apple's high-efficiency HEIC and HEIF formats. Convert your iPhone photos into widely accepted formats like WebP or JPG without downloading sketchy apps.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Video className="h-6 w-6 text-purple-500 mb-2" />
            <CardTitle className="text-lg">Video Compression</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Powered by FFmpeg WebAssembly. Compress bulky videos, trim clips, and encode to highly optimized H.264 (MP4) or WebM (VP9) directly in your browser tab.
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-dashed bg-muted/30">
          <CardHeader className="text-center">
            <ServerOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Zero Server Reliance</CardTitle>
            <CardDescription>Built with modern web APIs.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground text-center max-w-3xl mx-auto">
            Smart Convert functions as a Progressive Web App (PWA). Once loaded, many components of our app can run offline. The processing engines (`heic2any` and `FFmpeg.wasm`) are heavily optimized to execute directly within the V8 JavaScript engine of your browser, bypassing the need for expensive, slow, and privacy-invasive backend servers.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
