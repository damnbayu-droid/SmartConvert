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
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

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

    // Mark session as completed (user confirmed CTA)
    const latestSession = job.sessions[0];
    if (latestSession) {
      await db.jobSession.update({
        where: { id: latestSession.id },
        data: { status: 'completed' },
      });
    }

    // Update job to processing and increment credits
    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        creditsUsed: job.creditsUsed + 1,
      },
    });

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
