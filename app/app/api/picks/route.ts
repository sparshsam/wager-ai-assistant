
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const league = searchParams.get('league');
    const betType = searchParams.get('betType');
    const result = searchParams.get('result');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const whereClause: any = {
      userId: user.id,
    };

    if (sport) whereClause.sport = sport;
    if (league) whereClause.league = league;
    if (betType) whereClause.betType = betType;
    if (result) whereClause.result = result;
    
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) whereClause.date.lte = new Date(dateTo);
    }

    // Fetch picks
    const picks = await prisma.pick.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    // Calculate statistics
    const totalPicks = picks.length;
    const settledPicks = picks.filter(pick => ['Win', 'Loss', 'Push'].includes(pick.result));
    const wonPicks = picks.filter(pick => pick.result === 'Win');
    const lostPicks = picks.filter(pick => pick.result === 'Loss');

    const totalWagered = picks.reduce((sum, pick) => sum + pick.stake, 0);
    const totalWon = wonPicks.reduce((sum, pick) => sum + (pick.profitLoss || 0), 0);
    const totalLoss = Math.abs(lostPicks.reduce((sum, pick) => sum + (pick.profitLoss || 0), 0));
    const netProfit = totalWon - totalLoss;
    const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;
    const winRate = settledPicks.length > 0 ? (wonPicks.length / settledPicks.length) * 100 : 0;

    const stats = {
      current: user.currentBankroll || 1000,
      totalWagered,
      totalWon,
      totalLoss,
      netProfit,
      roi,
      winRate,
      totalPicks,
      settledPicks: settledPicks.length,
      pendingPicks: picks.filter(pick => pick.result === 'Pending').length,
    };

    return NextResponse.json({
      picks: picks.map(pick => ({
        ...pick,
        date: pick.date.toISOString(),
        createdAt: pick.createdAt.toISOString(),
        updatedAt: pick.updatedAt.toISOString(),
      })),
      stats,
    });
  } catch (error) {
    console.error('Fetch picks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch picks' },
      { status: 500 }
    );
  }
}
