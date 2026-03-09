import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'pending' && job.status !== 'waiting_cta') {
      return NextResponse.json(
        { error: 'Job is not in a valid state to start' },
        { status: 400 }
      );
    }

    // Update job status
    await db.job.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });

    // Create job session for tracking
    const creditStep = Math.floor(job.processedFiles / 5);
    await db.jobSession.create({
      data: {
        jobId,
        creditStep,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      status: 'processing',
    });
  } catch (error) {
    console.error('Start batch error:', error);
    return NextResponse.json(
      { error: 'Failed to start batch' },
      { status: 500 }
    );
  }
}
