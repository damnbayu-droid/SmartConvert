'use client';

/**
 * Self-contained video processor.
 * Loads ONLY @ffmpeg/ffmpeg from CDN. All utility functions are implemented locally.
 * This completely bypasses Cloudflare's edge bundler.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

let ffmpegInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/* ─── Self-implemented utilities (replaces @ffmpeg/util) ─── */

async function toBlobURL(url: string, mimeType: string): Promise<string> {
    const response = await fetch(url);
    const buf = await response.arrayBuffer();
    const blob = new Blob([buf], { type: mimeType });
    return URL.createObjectURL(blob);
}

async function fileToUint8Array(file: File): Promise<Uint8Array> {
    const buf = await file.arrayBuffer();
    return new Uint8Array(buf);
}

/* ─── CDN Script Loader ─── */

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Avoid duplicate loads
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Lazy-load FFmpeg from CDN. Only called in the browser at runtime.
 */
export async function getFFmpeg(): Promise<any> {
    if (ffmpegInstance) return ffmpegInstance;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        // Load only the FFmpeg wrapper (UMD) — no @ffmpeg/util needed
        await loadScript('/ffmpeg/ffmpeg.js');

        const FFmpegWASM = (window as any).FFmpegWASM;
        if (!FFmpegWASM || !FFmpegWASM.FFmpeg) {
            throw new Error('FFmpeg library failed to initialize');
        }

        const ff = new FFmpegWASM.FFmpeg();

        // Load single-threaded WASM core from CDN to avoid CF 25MB limit
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        await ff.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegInstance = ff;
        return ff;
    })();

    return loadingPromise;
}

/* ─── Types ─── */

export type CompressionPreset = 'high' | 'balanced' | 'max';

export interface VideoSettings {
    preset: CompressionPreset;
    trimStart?: number;
    trimEnd?: number;
    exportMp4: boolean;
    exportWebm: boolean;
}

export interface ProcessingResult {
    mp4Url?: string;
    mp4Size?: number;
    webmUrl?: string;
    webmSize?: number;
}

const CRF_MAP: Record<CompressionPreset, number> = {
    high: 20,
    balanced: 24,
    max: 28,
};

/* ─── Processing Pipeline ─── */

export async function processVideo(
    file: File,
    settings: VideoSettings,
    onProgress: (pct: number, stage: string) => void,
): Promise<ProcessingResult> {
    const ff = await getFFmpeg();

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() || '.mp4';
    const inputName = `input${ext}`;

    onProgress(2, 'Reading video file…');
    const fileData = await fileToUint8Array(file);
    await ff.writeFile(inputName, fileData);

    const crf = CRF_MAP[settings.preset];
    let currentInput = inputName;

    // Step 1: Trim
    if (settings.trimStart !== undefined || settings.trimEnd !== undefined) {
        onProgress(8, 'Trimming video…');
        const trimArgs = ['-i', currentInput];
        if (settings.trimStart !== undefined && settings.trimStart > 0) {
            trimArgs.push('-ss', String(settings.trimStart));
        }
        if (settings.trimEnd !== undefined) {
            const duration = settings.trimEnd - (settings.trimStart ?? 0);
            if (duration > 0) trimArgs.push('-t', String(duration));
        }
        trimArgs.push('-c', 'copy', '-avoid_negative_ts', '1', 'trimmed.mp4');
        await ff.exec(trimArgs);
        currentInput = 'trimmed.mp4';
    }

    const result: ProcessingResult = {};

    // Step 2: Encode MP4 H.264
    if (settings.exportMp4) {
        onProgress(12, 'Compressing MP4 (H.264)…');
        ff.on('progress', ({ progress }: { progress: number }) => {
            const pct = 12 + Math.round(progress * 38);
            onProgress(Math.min(pct, 50), 'Compressing MP4 (H.264)…');
        });

        await ff.exec([
            '-i', currentInput,
            '-c:v', 'libx264',
            '-crf', String(crf),
            '-preset', 'medium',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            'output.mp4',
        ]);

        const mp4Data = await ff.readFile('output.mp4');
        const mp4Bytes = mp4Data instanceof Uint8Array ? mp4Data : new Uint8Array(0);
        const mp4Buf = mp4Bytes.buffer.slice(mp4Bytes.byteOffset, mp4Bytes.byteOffset + mp4Bytes.byteLength) as ArrayBuffer;
        result.mp4Size = mp4Bytes.byteLength;
        result.mp4Url = URL.createObjectURL(new Blob([mp4Buf], { type: 'video/mp4' }));
    }

    // Step 3: Encode WebM VP9
    if (settings.exportWebm) {
        onProgress(55, 'Encoding WebM (VP9)…');
        ff.on('progress', ({ progress }: { progress: number }) => {
            const pct = 55 + Math.round(progress * 38);
            onProgress(Math.min(pct, 93), 'Encoding WebM (VP9)…');
        });

        await ff.exec([
            '-i', currentInput,
            '-c:v', 'libvpx-vp9',
            '-crf', String(crf),
            '-b:v', '0',
            '-c:a', 'libopus',
            '-b:a', '128k',
            'output.webm',
        ]);

        const webmData = await ff.readFile('output.webm');
        const webmBytes = webmData instanceof Uint8Array ? webmData : new Uint8Array(0);
        const webmBuf = webmBytes.buffer.slice(webmBytes.byteOffset, webmBytes.byteOffset + webmBytes.byteLength) as ArrayBuffer;
        result.webmSize = webmBytes.byteLength;
        result.webmUrl = URL.createObjectURL(new Blob([webmBuf], { type: 'video/webm' }));
    }

    // Cleanup
    onProgress(97, 'Finalizing…');
    for (const f of [inputName, 'trimmed.mp4', 'output.mp4', 'output.webm']) {
        try { await ff.deleteFile(f); } catch { /* ok */ }
    }

    onProgress(100, 'Complete!');
    return result;
}

/* ─── Helpers ─── */

export function isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function estimateCompressedSize(
    originalBytes: number,
    durationSec: number,
    preset: CompressionPreset,
): number {
    const bitrateMap: Record<CompressionPreset, number> = {
        high: 2000,
        balanced: 1200,
        max: 600,
    };
    const targetBytesPerSec = (bitrateMap[preset] * 1000) / 8;
    const estimated = targetBytesPerSec * durationSec;
    return Math.min(estimated, originalBytes * 0.9);
}
