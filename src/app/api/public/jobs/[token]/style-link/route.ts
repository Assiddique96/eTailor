import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const styleLink = await db.styleSelectionLink.findUnique({
      where: { token },
      include: {
        job: {
          include: {
            customer: {
              select: { firstName: true, lastName: true },
            },
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

    return NextResponse.json({ job: styleLink.job });
  } catch (error) {
    console.error('[GET /api/public/jobs/[token]/style-link]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
