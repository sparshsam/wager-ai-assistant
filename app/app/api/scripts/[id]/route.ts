
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// DELETE /api/scripts/[id] - Delete a specific betting script
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

    // Verify the script belongs to the user
    const script = await prisma.bettingScript.findUnique({
      where: { id },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    if (script.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.bettingScript.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting script:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/scripts/[id] - Update a specific betting script
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

    // Verify the script belongs to the user
    const existingScript = await prisma.bettingScript.findUnique({
      where: { id },
    });

    if (!existingScript) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    if (existingScript.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedScript = await prisma.bettingScript.update({
      where: { id },
      data: {
        league: body.league?.trim() || existingScript.league,
        sport: body.sport || existingScript.sport,
        content: body.content?.trim() || existingScript.content,
        description: body.description?.trim() || existingScript.description,
        fileName: body.fileName?.trim() || existingScript.fileName,
        version: body.version || `${parseFloat(existingScript.version) + 0.1}`,
        isActive: body.isActive !== undefined ? body.isActive : existingScript.isActive,
        rules: body.rules || existingScript.rules,
        guidelines: body.guidelines || existingScript.guidelines,
        stakeLogic: body.stakeLogic || existingScript.stakeLogic,
        riskManagement: body.riskManagement || existingScript.riskManagement,
      },
    });

    return NextResponse.json({ script: updatedScript });
  } catch (error) {
    console.error('Error updating script:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/scripts/[id] - Get a specific betting script
export async function GET(
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

    const script = await prisma.bettingScript.findUnique({
      where: { id },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    if (script.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Error fetching script:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
