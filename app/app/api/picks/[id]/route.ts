
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    const pickId = params.id;
    const body = await request.json();

    // Check if pick exists and belongs to user
    const existingPick = await prisma.pick.findFirst({
      where: {
        id: pickId,
        userId: user.id,
      },
    });

    if (!existingPick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    // Update the pick
    const updatedPick = await prisma.pick.update({
      where: { id: pickId },
      data: {
        result: body.result || existingPick.result,
        actualResult: body.actualResult !== undefined ? body.actualResult : existingPick.actualResult,
        profitLoss: body.profitLoss !== undefined ? body.profitLoss : existingPick.profitLoss,
        runningBankroll: body.runningBankroll !== undefined ? body.runningBankroll : existingPick.runningBankroll,
        bankrollChange: body.bankrollChange !== undefined ? body.bankrollChange : existingPick.bankrollChange,
        roi: body.roi !== undefined ? body.roi : existingPick.roi,
        notes: body.notes !== undefined ? body.notes : existingPick.notes,
        updatedAt: new Date(),
      },
    });

    // Update user's current bankroll if provided
    if (body.runningBankroll !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          currentBankroll: body.runningBankroll,
        },
      });

      // Create bankroll history entry if result changed
      if (body.result && body.result !== existingPick.result && body.result !== 'Pending') {
        let changeType = 'Adjustment';
        if (body.result === 'Win') changeType = 'Bet_Win';
        else if (body.result === 'Loss') changeType = 'Bet_Loss';

        await prisma.bankrollHistory.create({
          data: {
            userId: user.id,
            amount: body.runningBankroll,
            change: body.bankrollChange || 0,
            changeType,
            description: `Bet ${body.result.toLowerCase()}: ${existingPick.event}`,
            relatedPickId: pickId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      pick: {
        ...updatedPick,
        date: updatedPick.date.toISOString(),
        createdAt: updatedPick.createdAt.toISOString(),
        updatedAt: updatedPick.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update pick error:', error);
    return NextResponse.json(
      { error: 'Failed to update pick' },
      { status: 500 }
    );
  }
}

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

    const pickId = params.id;

    // Check if pick exists and belongs to user
    const existingPick = await prisma.pick.findFirst({
      where: {
        id: pickId,
        userId: user.id,
      },
    });

    if (!existingPick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    // Delete the pick
    await prisma.pick.delete({
      where: { id: pickId },
    });

    return NextResponse.json({
      success: true,
      message: 'Pick deleted successfully',
    });
  } catch (error) {
    console.error('Delete pick error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pick' },
      { status: 500 }
    );
  }
}
