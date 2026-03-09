import sharp from 'sharp';
import archiver from 'archiver';
import { createWriteStream, createReadStream, mkdirSync, rmSync, existsSync } from 'fs';
import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { randomUUID } from 'crypto';

const PORT = 3002;
const UPLOAD_DIR = '/tmp/smart-convert/uploads';
const OUTPUT_DIR = '/tmp/smart-convert/outputs';

// Ensure directories exist
function ensureDirectories() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

ensureDirectories();

interface ConversionSettings {
  quality: number;
  effort: number;
  nearLossless: boolean;
}

interface ConvertRequest {
  jobId: string;
  files: Array<{
    id: string;
    name: string;
    path: string;
    size: number;
  }>;
  settings: ConversionSettings;
}

interface ConversionResult {
  id: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  outputPath: string;
  savedPercent: number;
}

// Convert a single image to WebP
async function convertImage(
  inputPath: string,
  outputPath: string,
  settings: ConversionSettings
): Promise<{ size: number }> {
  const image = sharp(inputPath);
  
  const webpOptions: sharp.WebpOptions = {
    quality: settings.quality,
    effort: settings.effort,
  };
  
  if (settings.nearLossless) {
    webpOptions.nearLossless = true;
  }
  
  await image.webp(webpOptions).toFile(outputPath);
  
  const stats = await sharp(outputPath).metadata();
  const { size } = await import('fs/promises').then(fs => fs.stat(outputPath));
  
  return { size };
}

// Process a batch of images
async function processBatch(request: ConvertRequest): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];
  const jobDir = join(OUTPUT_DIR, request.jobId);
  
  if (!existsSync(jobDir)) {
    mkdirSync(jobDir, { recursive: true });
  }
  
  for (const file of request.files) {
    try {
      const outputName = basename(file.name, extname(file.name)) + '.webp';
      const outputPath = join(jobDir, outputName);
      
      const { size: newSize } = await convertImage(
        file.path,
        outputPath,
        request.settings
      );
      
      results.push({
        id: file.id,
        originalName: outputName,
        originalSize: file.size,
        newSize,
        outputPath,
        savedPercent: ((file.size - newSize) / file.size) * 100,
      });
    } catch (error) {
      console.error(`Failed to convert ${file.name}:`, error);
      // Continue with other files
    }
  }
  
  return results;
}

// Create a ZIP file from converted images
async function createZip(jobId: string, files: ConversionResult[]): Promise<string> {
  const zipPath = join(OUTPUT_DIR, `${jobId}.zip`);
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);
    
    archive.pipe(output);
    
    for (const file of files) {
      if (existsSync(file.outputPath)) {
        archive.file(file.outputPath, { name: file.originalName });
      }
    }
    
    archive.finalize();
  });
}

// Clean up old files (older than 1 hour)
async function cleanupOldFiles() {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  try {
    const { readdir, stat } = await import('fs/promises');
    
    for (const dir of [UPLOAD_DIR, OUTPUT_DIR]) {
      if (!existsSync(dir)) continue;
      
      const files = await readdir(dir);
      for (const file of files) {
        const filePath = join(dir, file);
        const fileStat = await stat(filePath);
        
        if (now - fileStat.mtimeMs > maxAge) {
          rmSync(filePath, { recursive: true, force: true });
          console.log(`Cleaned up: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// HTTP Server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'converter-worker' }, { headers: corsHeaders });
    }
    
    // Convert endpoint
    if (url.pathname === '/convert' && req.method === 'POST') {
      try {
        const body: ConvertRequest = await req.json();
        const results = await processBatch(body);
        
        return Response.json({ success: true, results }, { headers: corsHeaders });
      } catch (error) {
        console.error('Conversion error:', error);
        return Response.json(
          { error: 'Conversion failed', message: String(error) },
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // Create ZIP endpoint
    if (url.pathname === '/create-zip' && req.method === 'POST') {
      try {
        const body = await req.json() as { jobId: string; files: ConversionResult[] };
        const zipPath = await createZip(body.jobId, body.files);
        
        return Response.json({ 
          success: true, 
          zipPath,
          downloadUrl: `/download/${body.jobId}.zip`
        }, { headers: corsHeaders });
      } catch (error) {
        console.error('ZIP creation error:', error);
        return Response.json(
          { error: 'ZIP creation failed' },
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // Download endpoint
    if (url.pathname.startsWith('/download/')) {
      const filename = url.pathname.replace('/download/', '');
      const filePath = join(OUTPUT_DIR, filename);
      
      if (!existsSync(filePath)) {
        return Response.json({ error: 'File not found' }, { status: 404 });
      }
      
      const file = Bun.file(filePath);
      return new Response(file, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
    
    // Cleanup endpoint (for cron)
    if (url.pathname === '/cleanup' && req.method === 'POST') {
      await cleanupOldFiles();
      return Response.json({ success: true }, { headers: corsHeaders });
    }
    
    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  },
});

console.log(`🔄 Converter Worker running on port ${PORT}`);

// Run cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);
