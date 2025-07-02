
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/schedules - Fetch user's schedules with today's matches
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

    // Get all schedules
    const schedules = await prisma.leagueSchedule.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    // Get today's matches
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMatches = await prisma.leagueSchedule.findMany({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { time: 'asc' },
    });

    // Calculate stats
    const stats = {
      totalSchedules: schedules.length,
      todaysGames: todaysMatches.length,
      leaguesWithSchedules: new Set(schedules.map(s => s.league)).size,
    };

    return NextResponse.json({ schedules, todaysMatches, stats });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/schedules - Create a new schedule manually
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
    const { homeTeam, awayTeam, league, sport, date, time, venue } = body;

    if (!homeTeam || !awayTeam || !league || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const schedule = await prisma.leagueSchedule.create({
      data: {
        userId: user.id,
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        league: league.trim(),
        sport: sport || 'Unknown',
        date: new Date(date),
        time: time || null,
        venue: venue || null,
      },
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
