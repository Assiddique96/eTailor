import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadToImageKit } from '@/lib/imagekit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const formData = await request.formData();
    const mode = formData.get('mode') as string;
    const file = formData.get('file') as File | null;

    // Validate link
    const styleLink = await db.styleSelectionLink.findUnique({
      where: { token },
      include: {
        job: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!styleLink) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    if (styleLink.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Link expired' },
        { status: 403 }
      );
    }

    let uploadedImageUrl = null;
    let uploadedImagePath = null;

    // Handle file upload if mode is UPLOAD
    if (mode === 'UPLOAD' && file) {
      const buffer = await file.arrayBuffer();
      const result = await uploadToImageKit(
        Buffer.from(buffer),
        file.name,
        `job-styles/${styleLink.jobId}`
      );
      uploadedImageUrl = result.url;
      uploadedImagePath = result.filePath;
    }

    // Update all job tasks with the selected style
    await Promise.all(
      styleLink.job.tasks.map((task) =>
        db.jobTask.update({
          where: { id: task.id },
          data: {
            selectionMode: mode as any,
            uploadedImageUrl:
              mode === 'UPLOAD' ? uploadedImageUrl : null,
            uploadedImagePath:
              mode === 'UPLOAD' ? uploadedImagePath : null,
          },
        })
      )
    );

    // Mark link as used
    await db.styleSelectionLink.update({
      where: { id: styleLink.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Style selection saved successfully',
    });
  } catch (error) {
    console.error('[POST /api/public/jobs/[token]/style-selection]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
