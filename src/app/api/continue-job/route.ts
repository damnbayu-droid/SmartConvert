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
      .select('*, sessions:JobSession(*)')
      .eq('id', jobId)
      .order('createdAt', { foreignTable: 'sessions', ascending: false })
      .limit(1, { foreignTable: 'sessions' })
      .single();

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'waiting_cta') {
      return NextResponse.json(
        { error: 'Job is not waiting for CTA confirmation' },
        { status: 400 }
      );
    }

    const latestSession = job.sessions?.[0];
    if (latestSession) {
      await db
        .from('JobSession')
        .update({ status: 'completed' })
        .eq('id', latestSession.id);
    }

    // Update job to processing and increment credits
    await db
      .from('Job')
      .update({
        status: 'processing',
        creditsUsed: job.creditsUsed + 1,
      })
      .eq('id', jobId);

    return NextResponse.json({
      success: true,
      status: 'processing',
      creditsUsed: job.creditsUsed + 1,
    });
  } catch (error) {
    console.error('Continue job error:', error);
    return NextResponse.json(
      { error: 'Failed to continue job' },
      { status: 500 }
    );
  }
}
