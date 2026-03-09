'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

/**
 * Lazily load the multithreaded FFmpeg WASM core.
 * Reuses the same instance across calls.
 */
export async function getFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance) return ffmpegInstance;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        const ff = new FFmpeg();

        const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';

        await ff.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });

        ffmpegInstance = ff;
        return ff;
    })();

    return loadingPromise;
}

/* ─── types ─── */

export type CompressionPreset = 'high' | 'balanced' | 'max';

export interface VideoSettings {
    preset: CompressionPreset;
    trimStart?: number; // seconds
    trimEnd?: number;   // seconds
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

/* ─── pipeline ─── */

export async function processVideo(
    file: File,
    settings: VideoSettings,
    onProgress: (pct: number, stage: string) => void,
): Promise<ProcessingResult> {
    const ff = await getFFmpeg();

    // Determine input extension
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() || '.mp4';
    const inputName = `input${ext}`;

    // Write file into WASM virtual FS
    onProgress(0, 'Loading video…');
    const fileData = await fetchFile(file);
    await ff.writeFile(inputName, fileData);

    const crf = CRF_MAP[settings.preset];
    let currentInput = inputName;

    // ── Step 1: Trim (if requested) ──
    if (settings.trimStart !== undefined || settings.trimEnd !== undefined) {
        onProgress(5, 'Trimming video…');
        const trimArgs = ['-i', currentInput];

        if (settings.trimStart !== undefined && settings.trimStart > 0) {
            trimArgs.push('-ss', String(settings.trimStart));
        }
        if (settings.trimEnd !== undefined) {
            const duration = (settings.trimEnd) - (settings.trimStart ?? 0);
            if (duration > 0) {
                trimArgs.push('-t', String(duration));
            }
        }

        trimArgs.push('-c', 'copy', '-avoid_negative_ts', '1', 'trimmed.mp4');
        await ff.exec(trimArgs);
        currentInput = 'trimmed.mp4';
    }

    const result: ProcessingResult = {};

    // ── Step 2: Encode MP4 H.264 ──
    if (settings.exportMp4) {
        onProgress(10, 'Compressing MP4 (H.264)…');

        ff.on('progress', ({ progress }) => {
            const pct = 10 + Math.round(progress * 40); // 10-50%
            onProgress(Math.min(pct, 50), 'Compressing MP4 (H.264)…');
        });

        await ff.exec([
            '-i', currentInput,
            '-c:v', 'libx264',
            '-crf', String(crf),
            '-preset', 'slow',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            'output.mp4',
        ]);

        const mp4Data = await ff.readFile('output.mp4');
        const mp4Bytes = mp4Data instanceof Uint8Array ? mp4Data : new TextEncoder().encode(String(mp4Data));
        const mp4Copy = new Uint8Array(mp4Bytes.length);
        mp4Copy.set(mp4Bytes);
        result.mp4Size = mp4Copy.byteLength;
        result.mp4Url = URL.createObjectURL(new Blob([mp4Copy], { type: 'video/mp4' }));
    }

    // ── Step 3: Encode WebM VP9 ──
    if (settings.exportWebm) {
        onProgress(55, 'Encoding WebM (VP9)…');

        ff.on('progress', ({ progress }) => {
            const pct = 55 + Math.round(progress * 40); // 55-95%
            onProgress(Math.min(pct, 95), 'Encoding WebM (VP9)…');
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
        const webmBytes = webmData instanceof Uint8Array ? webmData : new TextEncoder().encode(String(webmData));
        const webmCopy = new Uint8Array(webmBytes.length);
        webmCopy.set(webmBytes);
        result.webmSize = webmCopy.byteLength;
        result.webmUrl = URL.createObjectURL(new Blob([webmCopy], { type: 'video/webm' }));
    }

    // ── Cleanup virtual FS ──
    onProgress(98, 'Finalizing…');
    const filesToClean = [inputName, 'trimmed.mp4', 'output.mp4', 'output.webm'];
    for (const f of filesToClean) {
        try { await ff.deleteFile(f); } catch { /* ignore */ }
    }

    onProgress(100, 'Done!');
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

/** Rough estimate of compressed size. */
export function estimateCompressedSize(
    originalBytes: number,
    durationSec: number,
    preset: CompressionPreset,
): number {
    // Rough target bitrates per preset (kbps)
    const bitrateMap: Record<CompressionPreset, number> = {
        high: 2000,
        balanced: 1200,
        max: 600,
    };
    const targetBytesPerSec = (bitrateMap[preset] * 1000) / 8;
    const estimated = targetBytesPerSec * durationSec;
    // Never exceed original
    return Math.min(estimated, originalBytes * 0.9);
}
