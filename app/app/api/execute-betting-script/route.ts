
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
    const { selectedMatches, previewData, cisAnalysis, bankroll } = body;

    if (!selectedMatches?.length || !cisAnalysis) {
      return NextResponse.json(
        { error: 'Selected matches and CIS analysis are required' },
        { status: 400 }
      );
    }

    // Prepare comprehensive prompt for betting script execution
    let scriptPrompt = `Execute betting script analysis and generate specific betting recommendations. You must respond with a JSON array of betting recommendations.

Each recommendation should have this exact structure:
{
  "matchup": "Team A vs Team B",
  "betType": "Moneyline|Point Spread|Total Points|Player Props|etc",
  "selection": "Specific selection (team, over/under, player)",
  "line": "Point spread or total line if applicable",
  "oddsAmerican": "American odds format (e.g., -110, +150)",
  "oddsDecimal": 1.91,
  "stake": 25,
  "scriptSummary": "Brief summary of script rules applied",
  "justification": "Detailed explanation for this bet",
  "confidence": 8,
  "potentialWin": 47.75
}

BETTING SCRIPT RULES AND DATA:`;

    // Add match data and script rules
    selectedMatches.forEach((match: any, index: number) => {
      scriptPrompt += `\n\nMATCH ${index + 1}: ${match.matchup}`;
      scriptPrompt += `\nLeague: ${match.league}`;
      scriptPrompt += `\nSport: ${match.sport}`;
      scriptPrompt += `\nDate: ${match.date}`;
      
      if (match.scriptRules?.length > 0) {
        scriptPrompt += `\nBetting Script Rules:`;
        match.scriptRules.forEach((rule: any, ruleIndex: number) => {
          scriptPrompt += `\n  ${ruleIndex + 1}. ${rule.rule || rule.description || JSON.stringify(rule)}`;
        });
      }
      
      if (match.fixtureData) {
        scriptPrompt += `\nFixture Data: ${JSON.stringify(match.fixtureData).slice(0, 500)}`;
      }
      
      if (match.statsData) {
        scriptPrompt += `\nStats Data: ${JSON.stringify(match.statsData).slice(0, 500)}`;
      }
    });

    scriptPrompt += `\n\nPREVIEW DATA:`;
    if (previewData?.preview) scriptPrompt += `\nAnalysis: ${previewData.preview}`;
    if (previewData?.odds) scriptPrompt += `\nOdds: ${previewData.odds}`;

    scriptPrompt += `\n\nCIS ANALYSIS:\n${cisAnalysis}`;

    scriptPrompt += `\n\nCURRENT BANKROLL: $${bankroll || 1000}`;

    scriptPrompt += `\n\nSTAKING GUIDELINES:
- Use 1-5% of bankroll for stakes based on confidence
- Never bet more than $100 per bet regardless of bankroll
- Avoid bets with odds worse than -300 unless exceptional confidence
- Confidence scale: 1-5 (avoid), 6-7 (small stake), 8-9 (medium stake), 10 (large stake)

Generate 1-3 betting recommendations based on the strongest opportunities from the data provided. Respond with raw JSON only.`;

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
            content: 'You are a professional betting script executor. Generate specific, actionable betting recommendations based on the provided data and rules. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: scriptPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    let recommendations = [];

    try {
      const responseContent = aiResponse.choices?.[0]?.message?.content || '{}';
      const parsedResponse = JSON.parse(responseContent);
      
      // Handle different possible response formats
      if (Array.isArray(parsedResponse)) {
        recommendations = parsedResponse;
      } else if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
        recommendations = parsedResponse.recommendations;
      } else if (parsedResponse.bets && Array.isArray(parsedResponse.bets)) {
        recommendations = parsedResponse.bets;
      } else {
        // Try to extract any array from the response
        const responseKeys = Object.keys(parsedResponse);
        for (const key of responseKeys) {
          if (Array.isArray(parsedResponse[key])) {
            recommendations = parsedResponse[key];
            break;
          }
        }
      }

      // Validate and enhance recommendations
      recommendations = recommendations.map((rec: any) => {
        const stake = rec.stake || 25;
        const oddsDecimal = rec.oddsDecimal || calculateDecimalOdds(rec.oddsAmerican || '-110');
        
        return {
          matchup: rec.matchup || 'Unknown Match',
          betType: rec.betType || 'Moneyline',
          selection: rec.selection || 'TBD',
          line: rec.line || null,
          oddsAmerican: rec.oddsAmerican || '-110',
          oddsDecimal: oddsDecimal,
          stake: stake,
          scriptSummary: rec.scriptSummary || 'Standard betting script applied',
          justification: rec.justification || 'Based on comprehensive analysis',
          confidence: rec.confidence || 7,
          potentialWin: stake * (oddsDecimal - 1),
        };
      });

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Create fallback recommendation
      recommendations = [{
        matchup: selectedMatches[0]?.matchup || 'Unknown Match',
        betType: 'Moneyline',
        selection: 'TBD',
        line: null,
        oddsAmerican: '-110',
        oddsDecimal: 1.91,
        stake: 25,
        scriptSummary: 'Analysis completed but formatting error occurred',
        justification: 'Recommendation generated based on available data',
        confidence: 6,
        potentialWin: 22.75,
      }];
    }

    return NextResponse.json({
      success: true,
      recommendations,
      executionDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Betting script execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute betting script' },
      { status: 500 }
    );
  }
}

function calculateDecimalOdds(americanOdds: string): number {
  const odds = parseFloat(americanOdds);
  if (isNaN(odds)) return 1.91; // default
  
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}
