
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/scripts - Fetch user's betting scripts
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

    const scripts = await prisma.bettingScript.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate stats
    const stats = {
      totalScripts: scripts.length,
      activeScripts: scripts.filter(s => s.isActive).length,
      leaguesCovered: new Set(scripts.map(s => s.league)).size,
      avgSuccessRate: scripts.length > 0 
        ? scripts.reduce((sum, s) => sum + (s.successRate || 0), 0) / scripts.length 
        : 0,
    };

    return NextResponse.json({ scripts, stats });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/scripts - Create a new betting script manually
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
    const { league, sport, content, description, fileName } = body;

    if (!league || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if script for this league already exists
    const existingScript = await prisma.bettingScript.findFirst({
      where: {
        userId: user.id,
        league: league.trim(),
      },
    });

    if (existingScript) {
      return NextResponse.json({ error: 'Script for this league already exists' }, { status: 400 });
    }

    const script = await prisma.bettingScript.create({
      data: {
        userId: user.id,
        league: league.trim(),
        sport: sport || 'Unknown',
        fileName: fileName || `${league.trim()}.txt`,
        content: content.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Error creating script:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
