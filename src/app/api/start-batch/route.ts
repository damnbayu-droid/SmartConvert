import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'edge';

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

    const { data: job, error } = await db
      .from('Job')
      .select('*')
      .eq('id', jobId)
      .single();

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
    await db
      .from('Job')
      .update({ status: 'processing' })
      .eq('id', jobId);

    // Create job session for tracking
    const creditStep = Math.floor(job.processedFiles / 5);
    await db.from('JobSession').insert([
      {
        jobId,
        creditStep,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

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
