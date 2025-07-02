
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { fileName, sport, league, bettingScript, fixtures, stats } = body;

    if (!fileName || !sport || !league) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, sport, league' },
        { status: 400 }
      );
    }

    // Deactivate previous uploads for the same sport/league
    await prisma.uploadedData.updateMany({
      where: {
        userId: user.id,
        sport,
        league,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Create new upload record
    const uploadedData = await prisma.uploadedData.create({
      data: {
        userId: user.id,
        fileName,
        sport,
        league,
        bettingScript: JSON.stringify(bettingScript || []),
        fixtures: JSON.stringify(fixtures || []),
        stats: JSON.stringify(stats || []),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      uploadId: uploadedData.id,
      message: 'Data uploaded successfully',
    });
  } catch (error) {
    console.error('Upload data error:', error);
    return NextResponse.json(
      { error: 'Failed to upload data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const league = searchParams.get('league');

    const whereClause: any = {
      userId: user.id,
      isActive: true,
    };

    if (sport) whereClause.sport = sport;
    if (league) whereClause.league = league;

    const uploadedData = await prisma.uploadedData.findMany({
      where: whereClause,
      orderBy: { uploadDate: 'desc' },
    });

    return NextResponse.json({
      uploads: uploadedData.map(upload => ({
        ...upload,
        bettingScript: upload.bettingScript ? JSON.parse(upload.bettingScript) : null,
        fixtures: upload.fixtures ? JSON.parse(upload.fixtures) : null,
        stats: upload.stats ? JSON.parse(upload.stats) : null,
      })),
    });
  } catch (error) {
    console.error('Fetch upload data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload data' },
      { status: 500 }
    );
  }
}
