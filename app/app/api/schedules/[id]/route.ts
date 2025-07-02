
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// DELETE /api/schedules/[id] - Delete a specific schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Verify the schedule belongs to the user
    const schedule = await prisma.leagueSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (schedule.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.leagueSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/schedules/[id] - Update a specific schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();

    // Verify the schedule belongs to the user
    const existingSchedule = await prisma.leagueSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (existingSchedule.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedSchedule = await prisma.leagueSchedule.update({
      where: { id },
      data: {
        homeTeam: body.homeTeam?.trim(),
        awayTeam: body.awayTeam?.trim(),
        league: body.league?.trim(),
        sport: body.sport || existingSchedule.sport,
        date: body.date ? new Date(body.date) : existingSchedule.date,
        time: body.time || existingSchedule.time,
        venue: body.venue || existingSchedule.venue,
        status: body.status || existingSchedule.status,
        homeScore: body.homeScore !== undefined ? body.homeScore : existingSchedule.homeScore,
        awayScore: body.awayScore !== undefined ? body.awayScore : existingSchedule.awayScore,
        notes: body.notes || existingSchedule.notes,
      },
    });

    return NextResponse.json({ schedule: updatedSchedule });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
