'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Upload,
    Video,
    Download,
    Loader2,
    AlertTriangle,
    FileVideo,
    Scissors,
    Settings2,
    Zap,
    Shield,
    RotateCcw,
    X,
    Clock,
    HardDrive,
    MonitorSmartphone,
    Info,
} from 'lucide-react';
import {
    processVideo,
    isMobileDevice,
    formatBytes,
    formatDuration,
    estimateCompressedSize,
    type CompressionPreset,
    type VideoSettings,
    type ProcessingResult,
} from '@/lib/video-processor';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─── Constants ─── */
const MAX_DESKTOP = 100 * 1024 * 1024; // 100 MB
const MAX_MOBILE = 50 * 1024 * 1024;   // 50 MB
const MAX_DURATION = 10 * 60;           // 10 min
const ACCEPTED_VIDEO = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm', 'video/x-msvideo'];
const ACCEPTED_EXT = ['.mp4', '.mov', '.mkv', '.webm', '.avi'];

type Stage = 'idle' | 'loaded' | 'processing' | 'completed' | 'error';

interface VideoMeta {
    duration: number;
    width: number;
    height: number;
    size: number;
    name: string;
}

/* ─── Presets ─── */
const PRESETS: { key: CompressionPreset; label: string; desc: string; crf: number }[] = [
    { key: 'high', label: 'High Quality', desc: 'Best visual quality, moderate compression', crf: 20 },
    { key: 'balanced', label: 'Balanced', desc: 'Recommended – good quality & size', crf: 24 },
    { key: 'max', label: 'Maximum Compression', desc: 'Smallest file size', crf: 28 },
];

export function VideoCompressor() {
    /* State */
    const [stage, setStage] = useState<Stage>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [meta, setMeta] = useState<VideoMeta | null>(null);
    const [preset, setPreset] = useState<CompressionPreset>('balanced');
    const [trimStart, setTrimStart] = useState('');
    const [trimEnd, setTrimEnd] = useState('');
    const [exportMp4, setExportMp4] = useState(true);
    const [exportWebm, setExportWebm] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');
    const [result, setResult] = useState<ProcessingResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [ffmpegLoading, setFfmpegLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

    const maxSize = isMobile ? MAX_MOBILE : MAX_DESKTOP;

    /* ─── File selection ─── */
    const handleFile = useCallback((f: File) => {
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        if (!ACCEPTED_VIDEO.includes(f.type) && !ACCEPTED_EXT.includes(ext)) {
            toast.error('Unsupported video format. Accepted: MP4, MOV, MKV, WebM, AVI');
            return;
        }
        if (f.size > maxSize) {
            toast.error(`File too large. Maximum is ${formatBytes(maxSize)}.`);
            return;
        }

        setFile(f);

        // Extract meta via a hidden <video> element
        const url = URL.createObjectURL(f);
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => {
            if (v.duration > MAX_DURATION) {
                toast.error(`Video is too long. Maximum duration is ${formatDuration(MAX_DURATION)}.`);
                URL.revokeObjectURL(url);
                setFile(null);
                return;
            }
            setMeta({
                duration: v.duration,
                width: v.videoWidth,
                height: v.videoHeight,
                size: f.size,
                name: f.name,
            });
            setStage('loaded');
            if (videoRef.current) {
                videoRef.current.src = url;
            }
        };
        v.onerror = () => {
            toast.error('Could not read video metadata.');
            URL.revokeObjectURL(url);
        };
        v.src = url;
    }, [maxSize]);

    /* ─── Drag & Drop ─── */
    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    }, [handleFile]);

    /* ─── Process ─── */
    const startProcessing = useCallback(async () => {
        if (!file) return;
        if (!exportMp4 && !exportWebm) {
            toast.error('Please select at least one output format.');
            return;
        }

        setStage('processing');
        setProgress(0);
        setProgressLabel('Loading FFmpeg engine…');
        setFfmpegLoading(true);

        try {
            // Lazy-load FFmpeg
            const { getFFmpeg } = await import('@/lib/video-processor');
            await getFFmpeg();
            setFfmpegLoading(false);

            const settings: VideoSettings = {
                preset,
                exportMp4,
                exportWebm,
                trimStart: trimStart ? parseFloat(trimStart) : undefined,
                trimEnd: trimEnd ? parseFloat(trimEnd) : undefined,
            };

            const res = await processVideo(file, settings, (pct, label) => {
                setProgress(pct);
                setProgressLabel(label);
            });

            setResult(res);
            setStage('completed');
        } catch (err: unknown) {
            console.error('Video processing error:', err);
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMsg(msg);
            setStage('error');
            toast.error(`Processing failed: ${msg}`);
        }
    }, [file, preset, trimStart, trimEnd, exportMp4, exportWebm]);

    /* ─── Reset ─── */
    const reset = useCallback(() => {
        // Revoke old blob URLs
        if (result?.mp4Url) URL.revokeObjectURL(result.mp4Url);
        if (result?.webmUrl) URL.revokeObjectURL(result.webmUrl);

        setStage('idle');
        setFile(null);
        setMeta(null);
        setPreset('balanced');
        setTrimStart('');
        setTrimEnd('');
        setExportMp4(true);
        setExportWebm(false);
        setProgress(0);
        setProgressLabel('');
        setResult(null);
        setErrorMsg('');
    }, [result]);

    /* ─── Estimated size ─── */
    const estimatedSize = meta
        ? estimateCompressedSize(
            meta.size,
            trimEnd ? parseFloat(trimEnd) - (parseFloat(trimStart) || 0) : meta.duration,
            preset,
        )
        : 0;

    /* ═══════════════ RENDER ═══════════════ */

    return (
        <div className="space-y-6">
            {/* Features bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Browser Processing</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">100% Private</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Video className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">H.264 + WebM</span>
                </div>
            </div>

            {/* Mobile warning */}
            {isMobile && stage === 'idle' && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                    <MonitorSmartphone className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-yellow-700">Mobile Device Detected</p>
                        <p className="text-xs text-yellow-600">
                            Large videos may fail on mobile devices. Maximum file size is limited to 50 MB.
                        </p>
                    </div>
                </div>
            )}

            {/* ── STAGE: IDLE ── */}
            {stage === 'idle' && (
                <Card
                    className={cn(
                        'border-2 border-dashed transition-colors cursor-pointer',
                        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                    )}
                    onDrop={onDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                >
                    <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">Drag & drop your video here</p>
                        <p className="text-muted-foreground mb-4">or</p>
                        <label>
                            <input
                                type="file"
                                accept={ACCEPTED_EXT.join(',')}
                                onChange={onFileInput}
                                className="hidden"
                            />
                            <Button variant="outline" asChild>
                                <span>Select File</span>
                            </Button>
                        </label>
                        <div className="mt-4 text-sm text-muted-foreground text-center space-y-1">
                            <p>Supported: MP4, MOV, MKV, WebM, AVI</p>
                            <p>Max size: {formatBytes(maxSize)} · Max duration: {formatDuration(MAX_DURATION)}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── STAGE: LOADED (settings) ── */}
            {stage === 'loaded' && meta && (
                <div className="space-y-6">
                    {/* File info + preview */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileVideo className="h-5 w-5" />
                                    Video Information
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={reset}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Preview */}
                                <div className="rounded-lg overflow-hidden bg-black aspect-video">
                                    <video
                                        ref={videoRef}
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                {/* Meta */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FileVideo className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">File:</span>
                                        <span className="font-medium truncate">{meta.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Size:</span>
                                        <span className="font-medium">{formatBytes(meta.size)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Resolution:</span>
                                        <span className="font-medium">{meta.width}×{meta.height}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Duration:</span>
                                        <span className="font-medium">{formatDuration(meta.duration)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compression presets */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Compression Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.key}
                                        onClick={() => setPreset(p.key)}
                                        className={cn(
                                            'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                                            preset === p.key
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border hover:border-primary/40',
                                        )}
                                    >
                                        <div className={cn(
                                            'mt-0.5 h-4 w-4 rounded-full border-2',
                                            preset === p.key ? 'border-primary bg-primary' : 'border-muted-foreground',
                                        )} />
                                        <div>
                                            <p className="font-medium text-sm">{p.label}</p>
                                            <p className="text-xs text-muted-foreground">{p.desc} (CRF {p.crf})</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Estimated output */}
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                                <Info className="h-4 w-4 text-primary" />
                                <span>
                                    <span className="text-muted-foreground">Estimated output:</span>{' '}
                                    <span className="font-semibold">{formatBytes(estimatedSize)}</span>
                                    {' '}
                                    <span className="text-muted-foreground">
                                        (≈{Math.round((1 - estimatedSize / meta.size) * 100)}% smaller)
                                    </span>
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trim controls */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Scissors className="h-5 w-5" />
                                Trim Video
                                <Badge variant="secondary" className="text-xs">Optional</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="trim-start">Start Time (seconds)</Label>
                                    <Input
                                        id="trim-start"
                                        type="number"
                                        placeholder="0"
                                        min={0}
                                        max={meta.duration}
                                        step={0.1}
                                        value={trimStart}
                                        onChange={(e) => setTrimStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trim-end">End Time (seconds)</Label>
                                    <Input
                                        id="trim-end"
                                        type="number"
                                        placeholder={formatDuration(meta.duration)}
                                        min={0}
                                        max={meta.duration}
                                        step={0.1}
                                        value={trimEnd}
                                        onChange={(e) => setTrimEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Leave empty to keep the full video. Total duration: {formatDuration(meta.duration)}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Output options */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Output Formats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="export-mp4"
                                    checked={exportMp4}
                                    onCheckedChange={(v) => setExportMp4(!!v)}
                                />
                                <Label htmlFor="export-mp4" className="flex items-center gap-2 cursor-pointer">
                                    Export MP4 (H.264)
                                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="export-webm"
                                    checked={exportWebm}
                                    onCheckedChange={(v) => setExportWebm(!!v)}
                                />
                                <Label htmlFor="export-webm" className="cursor-pointer">
                                    Export WebM (VP9)
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Start button */}
                    <Button onClick={startProcessing} size="lg" className="w-full text-base py-6">
                        <Zap className="mr-2 h-5 w-5" />
                        Start Compression
                    </Button>
                </div>
            )}

            {/* ── STAGE: PROCESSING ── */}
            {stage === 'processing' && (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <div>
                                <p className="font-semibold text-lg mb-1">Processing Video</p>
                                <p className="text-sm text-muted-foreground">{progressLabel}</p>
                                {ffmpegLoading && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        First-time loading may take 10-20 seconds…
                                    </p>
                                )}
                            </div>
                            <div className="w-full max-w-md">
                                <Progress value={progress} className="h-3" />
                                <p className="text-sm font-medium mt-2">{Math.round(progress)}%</p>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-sm">
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                                <span>Please keep this tab open. Video processing happens in your browser and may take a few minutes.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── STAGE: COMPLETED ── */}
            {stage === 'completed' && result && meta && (
                <div className="space-y-6">
                    {/* Summary */}
                    <Card className="border-green-500/30 bg-green-500/5">
                        <CardContent className="py-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <Download className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Compression Complete!</p>
                                    <p className="text-sm text-muted-foreground">Your optimized videos are ready to download.</p>
                                </div>
                            </div>

                            {/* Stats grid */}
                            <div className="grid sm:grid-cols-3 gap-4 mb-6">
                                <div className="rounded-lg bg-background p-4 text-center border">
                                    <p className="text-xs text-muted-foreground mb-1">Original Size</p>
                                    <p className="text-xl font-bold">{formatBytes(meta.size)}</p>
                                </div>
                                {result.mp4Size && (
                                    <div className="rounded-lg bg-background p-4 text-center border">
                                        <p className="text-xs text-muted-foreground mb-1">Compressed MP4</p>
                                        <p className="text-xl font-bold">{formatBytes(result.mp4Size)}</p>
                                        <p className="text-xs text-green-600 font-medium">
                                            {Math.round((1 - result.mp4Size / meta.size) * 100)}% smaller
                                        </p>
                                    </div>
                                )}
                                {result.webmSize && (
                                    <div className="rounded-lg bg-background p-4 text-center border">
                                        <p className="text-xs text-muted-foreground mb-1">Compressed WebM</p>
                                        <p className="text-xl font-bold">{formatBytes(result.webmSize)}</p>
                                        <p className="text-xs text-green-600 font-medium">
                                            {Math.round((1 - result.webmSize / meta.size) * 100)}% smaller
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Download buttons */}
                            <div className="flex flex-wrap gap-3">
                                {result.mp4Url && (
                                    <a href={result.mp4Url} download={`compressed_${meta.name.replace(/\.[^.]+$/, '.mp4')}`}>
                                        <Button size="lg" className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Download MP4
                                        </Button>
                                    </a>
                                )}
                                {result.webmUrl && (
                                    <a href={result.webmUrl} download={`compressed_${meta.name.replace(/\.[^.]+$/, '.webm')}`}>
                                        <Button size="lg" variant="outline" className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Download WebM
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* New compression */}
                    <Button variant="outline" onClick={reset} className="w-full gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Compress Another Video
                    </Button>
                </div>
            )}

            {/* ── STAGE: ERROR ── */}
            {stage === 'error' && (
                <Card className="border-destructive">
                    <CardContent className="py-8 text-center">
                        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
                        <p className="text-destructive font-medium mb-1">Processing Failed</p>
                        <p className="text-sm text-muted-foreground mb-2">
                            The video could not be processed. This may happen with very large files or unsupported codecs.
                        </p>
                        {errorMsg && (
                            <p className="text-xs text-destructive/80 font-mono bg-destructive/5 rounded p-2 mb-4 break-all">
                                {errorMsg}
                            </p>
                        )}
                        <Button variant="outline" onClick={reset} className="gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
