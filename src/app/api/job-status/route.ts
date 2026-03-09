import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

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

    const processedFiles = job.processedFiles;
    const totalFiles = job.totalFiles;
    const progress = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;
    const creditsRequired = Math.ceil(totalFiles / 5);
    const currentBatch = Math.floor(processedFiles / 5);

    // Check if we need to show CTA
    const showCta = 
      job.status === 'waiting_cta' ||
      (processedFiles > 0 && 
       processedFiles % 5 === 0 && 
       processedFiles < totalFiles &&
       job.status === 'processing');

    // Parse output files if completed
    let files = [];
    if (job.status === 'completed' && job.outputFiles) {
      try {
        files = JSON.parse(job.outputFiles);
      } catch (e) {
        console.error('Failed to parse output files:', e);
      }
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      totalFiles,
      processedFiles,
      progress,
      creditsUsed: job.creditsUsed,
      creditsRequired,
      currentBatch,
      showCta,
      downloadUrl: job.downloadUrl,
      files,
    });
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}
