import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'edge';

// Rate limiting - simple in-memory (in production, use Redis)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 50; // files per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 0, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }

  return {
    allowed: limit.count < RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - limit.count),
  };
}

function incrementRateLimit(ip: string, fileCount: number) {
  const limit = rateLimits.get(ip);
  if (limit) {
    limit.count += fileCount;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files, toolSlug, settings } = body;

    // Validate input
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > 30) {
      return NextResponse.json(
        { error: 'Maximum 30 files allowed' },
        { status: 400 }
      );
    }

    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Calculate credits needed (5 files = 1 credit)
    const creditsRequired = Math.ceil(files.length / 5);

    // Create job
    const jobId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { error: dbError } = await db.from('Job').insert([
      {
        id: jobId,
        toolSlug: toolSlug || 'image-to-webp',
        status: 'pending',
        totalFiles: files.length,
        processedFiles: 0,
        creditsUsed: 0,
        expiresAt: expiresAt.toISOString(),
        inputFiles: JSON.stringify(files),
        clientIp: ip,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    if (dbError) {
      console.error('Supabase insert error (Job):', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      });
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Increment rate limit
    incrementRateLimit(ip, files.length);

    return NextResponse.json({
      jobId,
      creditsRequired,
      totalFiles: files.length,
      rateLimit: {
        remaining: remaining - files.length,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
