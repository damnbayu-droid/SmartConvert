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
    CheckCircle2,
    ArrowDown,
    Film,
    Wand2,
} from 'lucide-react';
import {
    getFFmpeg,
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
import { useUserStore, VIP_EMAILS } from '@/store/user-store';
import { AdsBlockModal } from './ads-block-modal';

/* ─── Constants ─── */
const MAX_DESKTOP = 100 * 1024 * 1024;
const MAX_MOBILE = 50 * 1024 * 1024;
const MAX_DURATION = 10 * 60;
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

/* ─── Pipeline Steps (for interactive visualization) ─── */
const PIPELINE_STEPS = [
    { id: 'load', label: 'Loading Engine', icon: Wand2, range: [0, 5] },
    { id: 'read', label: 'Reading File', icon: Upload, range: [5, 10] },
    { id: 'trim', label: 'Trimming', icon: Scissors, range: [10, 12] },
    { id: 'mp4', label: 'Encoding MP4', icon: Film, range: [12, 50] },
    { id: 'webm', label: 'Encoding WebM', icon: Video, range: [50, 93] },
    { id: 'done', label: 'Finalizing', icon: CheckCircle2, range: [93, 100] },
];

/* ─── Presets ─── */
const PRESETS: { key: CompressionPreset; label: string; desc: string; crf: number; color: string }[] = [
    { key: 'high', label: 'High Quality', desc: 'Best visual quality, moderate compression', crf: 20, color: 'text-blue-500' },
    { key: 'balanced', label: 'Balanced', desc: 'Recommended – good quality & size', crf: 24, color: 'text-green-500' },
    { key: 'max', label: 'Maximum Compression', desc: 'Smallest file size', crf: 28, color: 'text-orange-500' },
];

export function VideoCompressor() {
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
    const [errorMsg, setErrorMsg] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);

    const { email, canUseVideo, isVip } = useUserStore();
    const [showAds, setShowAds] = useState(false);

    if (!canUseVideo()) {
        return (
            <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="py-20 flex flex-col items-center text-center">
                    <div className="p-4 bg-orange-100 rounded-full mb-6">
                        <FileVideo className="h-12 w-12 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Video Tools are Locked</CardTitle>
                    <p className="text-muted-foreground max-w-md mb-8">
                        The Video Compressor is an advanced tool reserved for <strong>Lifetime Pro</strong> members. 
                        Upgrade your plan to unlock high-speed browser-side video processing.
                    </p>
                    <div className="flex gap-4">
                        <Button 
                            onClick={() => window.open('https://pay.doku.com/p-link/p/WlZhSnHm9G', '_blank')}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Upgrade to Lifetime ($20)
                        </Button>
                        <Button variant="outline" onClick={() => window.location.href = '/'}>
                            Use Image Tools (Free)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

    // Timer for processing
    useEffect(() => {
        if (stage === 'processing') {
            setElapsedTime(0);
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [stage]);

    const maxSize = isMobile ? MAX_MOBILE : MAX_DESKTOP;

    /* ─── File selection ─── */
    const handleFile = useCallback((f: File) => {
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        if (!ACCEPTED_VIDEO.includes(f.type) && !ACCEPTED_EXT.includes(ext)) {
            toast.error('Unsupported format. Accepted: MP4, MOV, MKV, WebM, AVI');
            return;
        }
        if (f.size > maxSize) {
            toast.error(`File too large. Max: ${formatBytes(maxSize)}.`);
            return;
        }
        setFile(f);
        const url = URL.createObjectURL(f);
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => {
            if (v.duration > MAX_DURATION) {
                toast.error(`Video too long. Max: ${formatDuration(MAX_DURATION)}.`);
                URL.revokeObjectURL(url);
                setFile(null);
                return;
            }
            setMeta({ duration: v.duration, width: v.videoWidth, height: v.videoHeight, size: f.size, name: f.name });
            setStage('loaded');
            if (videoRef.current) videoRef.current.src = url;
        };
        v.onerror = () => { toast.error('Could not read video.'); URL.revokeObjectURL(url); };
        v.src = url;
    }, [maxSize]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    }, [handleFile]);

    /* ─── Process ─── */
    const executeProcessing = useCallback(async () => {
        setStage('processing');
        setProgress(0);
        setProgressLabel('Initializing FFmpeg engine…');
        setErrorMsg('');

        try {
            await getFFmpeg();

            const settings: VideoSettings = {
                preset, exportMp4, exportWebm,
                trimStart: trimStart ? parseFloat(trimStart) : undefined,
                trimEnd: trimEnd ? parseFloat(trimEnd) : undefined,
            };

            const res = await processVideo(file!, settings, (pct, label) => {
                setProgress(pct);
                setProgressLabel(label);
            });

            setResult(res);
            setStage('completed');
            toast.success('Video compressed successfully!');
        } catch (err: unknown) {
            console.error('Video processing error:', err);
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMsg(msg);
            setStage('error');
            toast.error(`Processing failed: ${msg}`);
        }
    }, [file, preset, trimStart, trimEnd, exportMp4, exportWebm]);

    const handleAdsComplete = (unlocked: boolean) => {
        setShowAds(false);
        if (unlocked) {
            executeProcessing();
        } else {
            setStage('loaded');
        }
    };

    const startProcessing = useCallback(async () => {
        if (!file) return;
        if (!exportMp4 && !exportWebm) { toast.error('Select at least one output format.'); return; }

        if (!isVip()) {
            setShowAds(true);
            return;
        }

        executeProcessing();
    }, [file, exportMp4, exportWebm, isVip, executeProcessing]);

    const reset = useCallback(() => {
        if (result?.mp4Url) URL.revokeObjectURL(result.mp4Url);
        if (result?.webmUrl) URL.revokeObjectURL(result.webmUrl);
        setStage('idle'); setFile(null); setMeta(null); setPreset('balanced');
        setTrimStart(''); setTrimEnd(''); setExportMp4(true); setExportWebm(false);
        setProgress(0); setProgressLabel(''); setResult(null); setErrorMsg(''); setElapsedTime(0);
    }, [result]);

    // 1-Minute Auto-Delete functionality
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (stage === 'completed') {
            timer = setTimeout(() => {
                reset();
                toast.info('Session cleared automatically to save memory.');
            }, 60000); // 60 seconds
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [stage, reset]);

    const estimatedSize = meta
        ? estimateCompressedSize(meta.size, trimEnd ? parseFloat(trimEnd) - (parseFloat(trimStart) || 0) : meta.duration, preset)
        : 0;

    /* ─── Get active pipeline step ─── */
    const getActiveStep = (pct: number) => {
        for (let i = PIPELINE_STEPS.length - 1; i >= 0; i--) {
            if (pct >= PIPELINE_STEPS[i].range[0]) return i;
        }
        return 0;
    };

    /* ═══════════════ RENDER ═══════════════ */
    return (
        <div className="space-y-6">
            {/* Feature badges */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: Zap, label: 'Browser Processing', color: 'text-yellow-500' },
                    { icon: Shield, label: '100% Private', color: 'text-green-500' },
                    { icon: Video, label: 'H.264 + WebM', color: 'text-blue-500' },
                ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
                        <Icon className={cn('h-4 w-4', color)} />
                        <span className="text-xs sm:text-sm font-medium">{label}</span>
                    </div>
                ))}
            </div>

            {/* Mobile warning */}
            {isMobile && stage === 'idle' && (
                <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                    <MonitorSmartphone className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-yellow-700">Mobile Device Detected</p>
                        <p className="text-xs text-yellow-600">Upload limited to 50 MB. Large videos may fail.</p>
                    </div>
                </div>
            )}

            {/* ══════ IDLE ══════ */}
            {stage === 'idle' && (
                <Card
                    className={cn(
                        'border-2 border-dashed transition-all duration-300 cursor-pointer',
                        isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50',
                    )}
                    onDrop={onDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                >
                    <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <Upload className={cn("h-8 w-8 transition-transform", isDragging ? "text-primary scale-110" : "text-muted-foreground")} />
                        </div>
                        <p className="text-lg font-semibold mb-1">Drop your video here</p>
                        <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
                        <label>
                            <input type="file" accept={ACCEPTED_EXT.join(',')} onChange={onFileInput} className="hidden" />
                            <Button variant="default" size="lg" asChild>
                                <span className="gap-2"><Upload className="h-4 w-4" /> Select Video File</span>
                            </Button>
                        </label>
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {['MP4', 'MOV', 'MKV', 'WebM', 'AVI'].map(fmt => (
                                <Badge key={fmt} variant="secondary" className="text-xs">{fmt}</Badge>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            Max: {formatBytes(maxSize)} · Duration: {formatDuration(MAX_DURATION)}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ══════ LOADED ══════ */}
            {stage === 'loaded' && meta && (
                <div className="space-y-5">
                    {/* Video preview + info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileVideo className="h-5 w-5" /> Video Information
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={reset}><X className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                                    <video ref={videoRef} controls className="w-full h-full object-contain" />
                                </div>
                                <div className="space-y-3 text-sm">
                                    {[
                                        { icon: FileVideo, label: 'File', value: meta.name },
                                        { icon: HardDrive, label: 'Size', value: formatBytes(meta.size) },
                                        { icon: MonitorSmartphone, label: 'Resolution', value: `${meta.width}×${meta.height}` },
                                        { icon: Clock, label: 'Duration', value: formatDuration(meta.duration) },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground">{label}:</span>
                                            <span className="font-medium truncate">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Presets */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings2 className="h-5 w-5" /> Compression Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                {PRESETS.map((p) => (
                                    <button key={p.key} onClick={() => setPreset(p.key)}
                                        className={cn(
                                            'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                                            preset === p.key ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm' : 'border-border hover:border-primary/40',
                                        )}>
                                        <div className={cn('mt-1 h-4 w-4 rounded-full border-2 transition-colors',
                                            preset === p.key ? 'border-primary bg-primary' : 'border-muted-foreground')} />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{p.label}</p>
                                            <p className="text-xs text-muted-foreground">{p.desc} (CRF {p.crf})</p>
                                        </div>
                                        {preset === p.key && <Badge variant="secondary" className="text-xs">Selected</Badge>}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                    <span className="text-muted-foreground">Estimated: </span>
                                    <span className="font-bold">{formatBytes(estimatedSize)}</span>
                                    <span className="text-green-600 font-medium ml-1">
                                        (↓{Math.round((1 - estimatedSize / meta.size) * 100)}%)
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trim */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Scissors className="h-5 w-5" /> Trim Video <Badge variant="secondary" className="text-xs">Optional</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="trim-start">Start (seconds)</Label>
                                    <Input id="trim-start" type="number" placeholder="0" min={0} max={meta.duration} step={0.1} value={trimStart} onChange={(e) => setTrimStart(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trim-end">End (seconds)</Label>
                                    <Input id="trim-end" type="number" placeholder={String(Math.floor(meta.duration))} min={0} max={meta.duration} step={0.1} value={trimEnd} onChange={(e) => setTrimEnd(e.target.value)} />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Leave empty = full video ({formatDuration(meta.duration)})</p>
                        </CardContent>
                    </Card>

                    {/* Output format */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2"><Download className="h-5 w-5" /> Output</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Checkbox id="mp4" checked={exportMp4} onCheckedChange={(v) => setExportMp4(!!v)} />
                                <Label htmlFor="mp4" className="flex items-center gap-2 cursor-pointer">MP4 (H.264) <Badge variant="outline" className="text-xs">Recommended</Badge></Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox id="webm" checked={exportWebm} onCheckedChange={(v) => setExportWebm(!!v)} />
                                <Label htmlFor="webm" className="cursor-pointer">WebM (VP9)</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Button onClick={startProcessing} size="lg" className="w-full text-base py-6 gap-2">
                        <Zap className="h-5 w-5" /> Start Compression
                    </Button>
                </div>
            )}

            {/* ══════ PROCESSING (Interactive Pipeline) ══════ */}
            {stage === 'processing' && (
                <Card className="overflow-hidden">
                    <CardContent className="py-8">
                        <div className="flex flex-col items-center text-center space-y-8">
                            {/* Animated spinner with progress */}
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full border-4 border-muted flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
                                </div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                            </div>

                            <div>
                                <p className="font-semibold text-lg mb-1">Processing Video</p>
                                <p className="text-sm text-muted-foreground">{progressLabel}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Elapsed: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full max-w-lg">
                                <Progress value={progress} className="h-3" />
                            </div>

                            {/* Pipeline visualization */}
                            <div className="w-full max-w-lg">
                                <div className="grid grid-cols-6 gap-1">
                                    {PIPELINE_STEPS.map((step, i) => {
                                        const active = getActiveStep(progress);
                                        const StepIcon = step.icon;
                                        const isDone = i < active;
                                        const isCurrent = i === active;
                                        return (
                                            <div key={step.id} className="flex flex-col items-center gap-1">
                                                <div className={cn(
                                                    'h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500',
                                                    isDone ? 'bg-green-500 text-white scale-100' :
                                                        isCurrent ? 'bg-primary text-primary-foreground scale-110 animate-pulse' :
                                                            'bg-muted text-muted-foreground scale-90',
                                                )}>
                                                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                                                </div>
                                                <span className={cn(
                                                    'text-[10px] leading-tight text-center',
                                                    isCurrent ? 'text-primary font-medium' : 'text-muted-foreground',
                                                )}>{step.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-sm rounded-lg bg-muted/50 p-3">
                                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                                <span>Keep this tab open. Processing happens in your browser.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ══════ COMPLETED ══════ */}
            {stage === 'completed' && result && meta && (
                <div className="space-y-5">
                    <Card className="border-green-500/30 bg-gradient-to-b from-green-500/5 to-transparent">
                        <CardContent className="py-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">Compression Complete!</p>
                                    <p className="text-sm text-muted-foreground">
                                        Processed in {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid sm:grid-cols-3 gap-3 mb-6">
                                <div className="rounded-xl bg-background p-4 text-center border">
                                    <p className="text-xs text-muted-foreground mb-1">Original</p>
                                    <p className="text-xl font-bold">{formatBytes(meta.size)}</p>
                                </div>
                                {result.mp4Size != null && (
                                    <div className="rounded-xl bg-background p-4 text-center border border-green-500/20">
                                        <p className="text-xs text-muted-foreground mb-1">MP4</p>
                                        <p className="text-xl font-bold">{formatBytes(result.mp4Size)}</p>
                                        <p className="text-xs text-green-600 font-semibold">↓{Math.round((1 - result.mp4Size / meta.size) * 100)}%</p>
                                    </div>
                                )}
                                {result.webmSize != null && (
                                    <div className="rounded-xl bg-background p-4 text-center border border-blue-500/20">
                                        <p className="text-xs text-muted-foreground mb-1">WebM</p>
                                        <p className="text-xl font-bold">{formatBytes(result.webmSize)}</p>
                                        <p className="text-xs text-blue-600 font-semibold">↓{Math.round((1 - result.webmSize / meta.size) * 100)}%</p>
                                    </div>
                                )}
                            </div>

                            {/* Downloads */}
                            <div className="flex flex-wrap gap-3">
                                {result.mp4Url && (
                                    <a href={result.mp4Url} download={`compressed_${meta.name.replace(/\.[^.]+$/, '.mp4')}`}>
                                        <Button size="lg" className="gap-2 shadow-md">
                                            <Download className="h-4 w-4" /> Download MP4
                                        </Button>
                                    </a>
                                )}
                                {result.webmUrl && (
                                    <a href={result.webmUrl} download={`compressed_${meta.name.replace(/\.[^.]+$/, '.webm')}`}>
                                        <Button size="lg" variant="outline" className="gap-2">
                                            <Download className="h-4 w-4" /> Download WebM
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Button variant="outline" onClick={reset} className="w-full gap-2">
                        <RotateCcw className="h-4 w-4" /> Compress Another Video
                    </Button>
                </div>
            )}

            {/* ══════ ERROR ══════ */}
            {stage === 'error' && (
                <Card className="border-destructive/50">
                    <CardContent className="py-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
                        <p className="text-destructive font-semibold text-lg mb-1">Processing Failed</p>
                        <p className="text-sm text-muted-foreground mb-3">
                            Could not process the video. Try a smaller file or different format.
                        </p>
                        {errorMsg && (
                            <div className="text-xs text-destructive/80 font-mono bg-destructive/5 rounded-lg p-3 mb-4 max-w-md mx-auto break-all">
                                {errorMsg}
                            </div>
                        )}
                        <Button variant="outline" onClick={reset} className="gap-2">
                            <RotateCcw className="h-4 w-4" /> Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            <AdsBlockModal
                isOpen={showAds}
                onClose={handleAdsComplete}
                reason="limit"
            />
        </div>
    );
}
