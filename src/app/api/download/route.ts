import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'edge';

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

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Job is not completed yet' },
        { status: 400 }
      );
    }

    // In production, this would generate a signed URL for the actual file
    // For now, return a mock download URL
    const downloadUrl = job.downloadUrl || `/api/download/file?jobId=${jobId}`;

    return NextResponse.json({
      downloadUrl,
      filename: `smart-convert-${jobId}.zip`,
      files: job.outputFiles ? JSON.parse(job.outputFiles) : [],
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to get download link' },
      { status: 500 }
    );
  }
}
