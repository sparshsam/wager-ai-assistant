
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { SUPPORTED_SPORTS } from '@/lib/types';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// POST /api/scripts/upload - Upload text betting script
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
    const { fileName, league, content, sport } = body;

    if (!fileName || !league || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auto-detect sport from league name if not provided
    let detectedSport = sport || 'Unknown';
    if (!sport || sport === 'Unknown') {
      const lowerLeague = league.toLowerCase();
      if (lowerLeague.includes('nba')) detectedSport = 'NBA';
      else if (lowerLeague.includes('wnba')) detectedSport = 'WNBA';
      else if (lowerLeague.includes('mls')) detectedSport = 'MLS';
      else if (lowerLeague.includes('ufc')) detectedSport = 'UFC';
      else if (lowerLeague.includes('nhl')) detectedSport = 'NHL';
      else if (lowerLeague.includes('nfl')) detectedSport = 'NFL';
      else if (lowerLeague.includes('mlb')) detectedSport = 'MLB';
      else if (lowerLeague.includes('premier')) detectedSport = 'Premier League';
      else if (lowerLeague.includes('champions')) detectedSport = 'Champions League';
      else if (lowerLeague.includes('la liga')) detectedSport = 'La Liga';
      else if (lowerLeague.includes('serie a')) detectedSport = 'Serie A';
      else if (lowerLeague.includes('bundesliga')) detectedSport = 'Bundesliga';
      else if (lowerLeague.includes('tennis')) detectedSport = 'Tennis';
    }

    // Check if script for this league already exists
    const existingScript = await prisma.bettingScript.findFirst({
      where: {
        userId: user.id,
        league: league.trim(),
      },
    });

    if (existingScript) {
      // Update existing script
      const updatedScript = await prisma.bettingScript.update({
        where: { id: existingScript.id },
        data: {
          fileName: fileName.trim(),
          content: content.trim(),
          sport: detectedSport,
          version: `${parseFloat(existingScript.version) + 0.1}`,
          lastUsed: null, // Reset usage stats
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        fileName,
        league: league.trim(),
        content: content.trim(),
        script: updatedScript,
        updated: true,
      });
    } else {
      // Create new script
      const script = await prisma.bettingScript.create({
        data: {
          userId: user.id,
          league: league.trim(),
          sport: detectedSport,
          fileName: fileName.trim(),
          content: content.trim(),
        },
      });

      return NextResponse.json({
        success: true,
        fileName,
        league: league.trim(),
        content: content.trim(),
        script,
        updated: false,
      });
    }
  } catch (error) {
    console.error('Error uploading script:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
