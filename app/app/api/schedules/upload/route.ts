
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// POST /api/schedules/upload - Upload Excel schedule data
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
    const { fileName, schedules } = body;

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json({ error: 'Invalid schedule data' }, { status: 400 });
    }

    let successfulRows = 0;
    let todaysMatches = 0;
    const errors: string[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Process each schedule
    for (const [index, scheduleData] of schedules.entries()) {
      try {
        const { date, homeTeam, awayTeam, league, sport, time, venue } = scheduleData;

        if (!date || !homeTeam || !awayTeam || !league) {
          errors.push(`Row ${index + 1}: Missing required fields`);
          continue;
        }

        const scheduleDate = new Date(date);
        
        // Check if this is today's match
        if (scheduleDate >= today && scheduleDate < tomorrow) {
          todaysMatches++;
        }

        await prisma.leagueSchedule.create({
          data: {
            userId: user.id,
            date: scheduleDate,
            homeTeam: String(homeTeam).trim(),
            awayTeam: String(awayTeam).trim(),
            league: String(league).trim(),
            sport: sport ? String(sport).trim() : 'Unknown',
            time: time ? String(time).trim() : null,
            venue: venue ? String(venue).trim() : null,
          },
        });

        successfulRows++;
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
        errors.push(`Row ${index + 1}: Processing error`);
      }
    }

    const result = {
      success: true,
      fileName,
      totalRows: schedules.length,
      successfulRows,
      todaysMatches,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
