
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
    const {
      sport,
      league,
      event,
      betType,
      selection,
      line,
      oddsAmerican,
      oddsDecimal,
      stake,
      potentialWin,
      cisGenerated,
      scriptSummary,
      justification,
      confidence,
      matchId,
      tags,
      notes,
    } = body;

    // Validate required fields
    if (!sport || !league || !event || !betType || !selection || !oddsAmerican || !stake) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the pick
    const pick = await prisma.pick.create({
      data: {
        userId: user.id,
        matchId: matchId || null,
        sport,
        league,
        event,
        betType,
        selection,
        line: line || null,
        oddsAmerican,
        oddsDecimal: oddsDecimal || null,
        stake: parseFloat(stake),
        potentialWin: potentialWin ? parseFloat(potentialWin) : null,
        cisGenerated: cisGenerated || null,
        scriptSummary: scriptSummary || null,
        justification: justification || null,
        confidence: confidence || null,
        tags: tags || null,
        notes: notes || null,
        result: 'Pending',
      },
    });

    // Update user's bankroll tracking
    const currentBankroll = user.currentBankroll || 1000;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentBankroll: currentBankroll, // Keep same for pending bets
      },
    });

    // Create bankroll history entry
    await prisma.bankrollHistory.create({
      data: {
        userId: user.id,
        amount: currentBankroll,
        change: 0, // No change for pending bet
        changeType: 'Bet_Placed',
        description: `Bet placed: ${event} - ${betType}`,
        relatedPickId: pick.id,
      },
    });

    return NextResponse.json({
      success: true,
      pick: {
        id: pick.id,
        entryId: pick.entryId,
        event: pick.event,
        betType: pick.betType,
        selection: pick.selection,
        stake: pick.stake,
      },
    });
  } catch (error) {
    console.error('Pick logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log pick' },
      { status: 500 }
    );
  }
}
