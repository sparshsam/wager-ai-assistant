
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { selectedMatches, previewAnalysis, oddsData } = body;

    if (!selectedMatches?.length && !previewAnalysis && !oddsData) {
      return NextResponse.json(
        { error: 'Insufficient data for CIS generation' },
        { status: 400 }
      );
    }

    // Prepare comprehensive prompt for AI analysis
    let analysisPrompt = `Generate a comprehensive intelligence summary (CIS) for betting analysis. Structure your response with the following sections:

KEY STATS:
Provide statistical analysis and key performance metrics.

FORM & PATTERN:
Analyze recent form, patterns, and trends.

INJURY INSIGHTS:
Detail any injury concerns and team news impact.

OPPORTUNITIES & RISKS:
Identify betting opportunities and potential risks.

MARKET EVALUATION:
Evaluate the betting markets and identify value.

Data available for analysis:`;

    if (selectedMatches?.length > 0) {
      analysisPrompt += `\n\nSELECTED MATCHES:`;
      selectedMatches.forEach((match: any, index: number) => {
        analysisPrompt += `\n${index + 1}. ${match.matchup} (${match.league})`;
        analysisPrompt += `\n   Date: ${match.date}`;
        if (match.venue) analysisPrompt += `\n   Venue: ${match.venue}`;
        if (match.homeForm || match.awayForm) {
          analysisPrompt += `\n   Form: Home ${match.homeForm || 'N/A'} | Away ${match.awayForm || 'N/A'}`;
        }
        if (match.homeInjuries || match.awayInjuries) {
          analysisPrompt += `\n   Injuries: Home ${match.homeInjuries || 'None'} | Away ${match.awayInjuries || 'None'}`;
        }
        if (match.trends) analysisPrompt += `\n   Trends: ${match.trends}`;
        if (match.statsData) analysisPrompt += `\n   Stats Data Available: Yes`;
        if (match.scriptData) analysisPrompt += `\n   Betting Script Available: Yes`;
      });
    }

    if (previewAnalysis) {
      analysisPrompt += `\n\nPREVIEW ANALYSIS:\n${previewAnalysis}`;
    }

    if (oddsData) {
      analysisPrompt += `\n\nODDS DATA:\n${oddsData}`;
    }

    analysisPrompt += `\n\nPlease provide a detailed, professional analysis following The Wager's established tone - analytical, confident, and focused on value identification. Include specific recommendations where possible.`;

    // Make request to AI API
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert sports betting analyst with deep knowledge of statistics, team performance, and market dynamics. Provide comprehensive, actionable betting intelligence.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const generatedCIS = aiResponse.choices?.[0]?.message?.content || 'Failed to generate CIS analysis.';

    return NextResponse.json({
      success: true,
      cis: generatedCIS,
      analysisDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('CIS generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CIS analysis' },
      { status: 500 }
    );
  }
}
