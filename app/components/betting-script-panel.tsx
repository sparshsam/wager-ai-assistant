
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  PlayCircle, 
  Copy, 
  RefreshCw, 
  AlertCircle,
  DollarSign,
  Target,
  TrendingUp,
  Shield,
  FileText,
  Calculator,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Match, BET_TYPES } from '@/lib/types';

interface BettingScriptPanelProps {
  selectedMatches: Match[];
  selectedSchedule?: any;
  selectedScript?: any;
  previewData: { preview: string; odds: string };
  statsInput?: string;
  cisResult: string;
  injuryValidation?: {
    detected: boolean;
    keywords: string[];
    confidence: number;
    suggestions: string[];
  };
  onPickLogged: () => void;
}

interface BettingRecommendation {
  matchup: string;
  betType: string;
  selection: string;
  line?: string;
  oddsAmerican: string;
  oddsDecimal: number;
  stake: number;
  scriptSummary: string;
  justification: string;
  confidence: number;
  potentialWin: number;
}

export default function BettingScriptPanel({ 
  selectedMatches,
  selectedSchedule,
  selectedScript,
  previewData, 
  statsInput,
  cisResult, 
  injuryValidation,
  onPickLogged 
}: BettingScriptPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [recommendations, setRecommendations] = useState<BettingRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string>('');
  const [bankroll, setBankroll] = useState<number>(1000);
  const { toast } = useToast();

  // V2 Enhanced validation logic
  const hasSchedule = !!selectedSchedule;
  const hasScript = !!selectedScript;
  const hasCIS = !!cisResult;
  const hasPreview = !!previewData.preview;
  const hasStats = !!statsInput;
  
  const hasRequiredData = hasSchedule && hasScript && hasCIS;
  const hasOptimalData = hasRequiredData && hasPreview && hasStats;

  const executeBettingScript = async () => {
    if (!hasRequiredData) {
      const missing = [];
      if (!hasSchedule) missing.push('match selection');
      if (!hasScript) missing.push('betting script');
      if (!hasCIS) missing.push('CIS analysis');
      
      toast({
        title: 'Missing Required Data',
        description: `Please provide: ${missing.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    
    try {
      // V2 Enhanced script execution data
      const scriptExecutionData = {
        // Primary match from schedule
        selectedMatch: selectedSchedule ? {
          matchup: `${selectedSchedule.homeTeam} vs ${selectedSchedule.awayTeam}`,
          league: selectedSchedule.league,
          sport: selectedSchedule.sport,
          date: selectedSchedule.date,
          time: selectedSchedule.time,
          venue: selectedSchedule.venue,
        } : null,
        
        // Betting script from database
        bettingScript: selectedScript ? {
          league: selectedScript.league,
          content: selectedScript.content,
          version: selectedScript.version,
          stakeLogic: selectedScript.stakeLogic,
          riskManagement: selectedScript.riskManagement,
          guidelines: selectedScript.guidelines,
        } : null,
        
        // Manual input data (replaces Excel sheets)
        previewData,
        manualStats: statsInput,
        cisAnalysis: cisResult,
        
        // Enhanced context
        injuryContext: injuryValidation,
        bankroll,
        
        // Legacy support for backward compatibility
        legacyMatches: selectedMatches.length > 0 ? selectedMatches.map(match => ({
          matchup: `${match.homeTeam} vs ${match.awayTeam}`,
          league: match.league,
          sport: match.sport,
        })) : [],
        
        // Execution metadata
        dataSource: 'v2_database_script',
        executionTimestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/execute-betting-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptExecutionData),
      });

      if (!response.ok) {
        throw new Error('Failed to execute betting script');
      }

      const result = await response.json();
      const generatedRecommendations = result.recommendations || [];
      
      setRecommendations(generatedRecommendations);

      toast({
        title: 'Script Executed Successfully',
        description: `Generated ${generatedRecommendations.length} betting recommendations.`,
      });
    } catch (error) {
      console.error('Script execution error:', error);
      toast({
        title: 'Execution Failed',
        description: 'Failed to execute betting script. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const logSelectedPick = async () => {
    const recommendation = recommendations.find(r => 
      `${r.matchup}-${r.betType}-${r.selection}` === selectedRecommendation
    );

    if (!recommendation) {
      toast({
        title: 'No Selection',
        description: 'Please select a recommendation to log.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const pickData = {
        sport: selectedSchedule?.sport || selectedMatches[0]?.sport || 'Unknown',
        league: selectedSchedule?.league || selectedMatches[0]?.league || 'Unknown',
        event: recommendation.matchup,
        betType: recommendation.betType,
        selection: recommendation.selection,
        line: recommendation.line,
        oddsAmerican: recommendation.oddsAmerican,
        oddsDecimal: recommendation.oddsDecimal,
        stake: recommendation.stake,
        potentialWin: recommendation.potentialWin,
        cisGenerated: cisResult,
        scriptSummary: recommendation.scriptSummary,
        justification: recommendation.justification,
        confidence: recommendation.confidence,
        matchId: selectedSchedule?.id || selectedMatches[0]?.id,
      };

      const response = await fetch('/api/log-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pickData),
      });

      if (!response.ok) {
        throw new Error('Failed to log pick');
      }

      onPickLogged();
      setSelectedRecommendation('');
      
      toast({
        title: 'Pick Logged Successfully',
        description: `${recommendation.betType} bet on ${recommendation.matchup} has been logged.`,
      });
    } catch (error) {
      console.error('Pick logging error:', error);
      toast({
        title: 'Logging Failed',
        description: 'Failed to log the pick. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyRecommendations = async () => {
    if (recommendations.length === 0) return;
    
    const text = recommendations.map(rec => 
      `${rec.matchup} - ${rec.betType}: ${rec.selection} ${rec.line ? `(${rec.line})` : ''} @ ${rec.oddsAmerican} - Stake: $${rec.stake} - Confidence: ${rec.confidence}/10`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to Clipboard',
        description: 'All recommendations copied successfully.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const calculateOddsDecimal = (american: string): number => {
    const odds = parseFloat(american);
    if (odds > 0) {
      return (odds / 100) + 1;
    } else {
      return (100 / Math.abs(odds)) + 1;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Smart Betting Script Executor v2.0
          {selectedScript && (
            <Badge variant="secondary">
              {selectedScript.league} Script v{selectedScript.version}
            </Badge>
          )}
          {recommendations.length > 0 && (
            <Badge variant="default">
              {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Execute database-stored scripts with enhanced validation and automated staking
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* V2 Script Status and Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={`p-3 text-center ${hasSchedule ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{hasSchedule ? 'Selected' : 'Missing'}</p>
            <p className="text-xs text-muted-foreground">Schedule</p>
          </Card>
          
          <Card className={`p-3 text-center ${hasScript ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{hasScript ? 'Loaded' : 'Missing'}</p>
            <p className="text-xs text-muted-foreground">Betting Script</p>
          </Card>
          
          <Card className={`p-3 text-center ${hasCIS ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{hasCIS ? 'Generated' : 'Missing'}</p>
            <p className="text-xs text-muted-foreground">CIS Analysis</p>
          </Card>
          
          <Card className="p-3 text-center bg-blue-50 dark:bg-blue-950/20">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">${bankroll}</p>
            <p className="text-xs text-muted-foreground">Current Bankroll</p>
          </Card>
        </div>

        {/* V2 Enhanced Validation Status */}
        {!hasRequiredData && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Missing Required Data for Script Execution
              </span>
            </div>
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Required: Match selection, betting script, and CIS analysis. Optional: Manual stats and injury data for enhanced recommendations.
            </div>
          </Card>
        )}

        {hasRequiredData && !hasOptimalData && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Ready for execution - Add preview and stats for optimal results
              </span>
            </div>
          </Card>
        )}

        {selectedScript && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Active Script: {selectedScript.league} v{selectedScript.version}</span>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Used {selectedScript.timesUsed || 0} times • 
                {selectedScript.successRate ? ` ${selectedScript.successRate.toFixed(1)}% success rate` : ' No performance data yet'}
              </div>
            </div>
          </Card>
        )}

        {/* Execution Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasOptimalData
              ? `✅ Ready to execute ${selectedScript?.league} script with optimal data`
              : hasRequiredData 
                ? `⚠️ Ready to execute with partial data - ${selectedScript?.league || 'script'} available`
                : '❌ Missing required data for script execution'
            }
          </div>
          
          <div className="flex items-center gap-2">
            {recommendations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyRecommendations}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy All
              </Button>
            )}
            
            <Button
              onClick={executeBettingScript}
              disabled={!hasRequiredData || isExecuting}
              className="flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Execute Script
                </>
              )}
            </Button>
          </div>
        </div>

        {/* V2 Script Content Display */}
        {selectedScript && (
          <Card className="p-4 bg-muted/30">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Active Script Content Preview
            </h4>
            <div className="space-y-2 text-sm">
              <div className="bg-muted/50 p-3 rounded border">
                <div className="font-medium text-xs text-muted-foreground mb-1">
                  {selectedScript.fileName} • v{selectedScript.version}
                </div>
                <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                  {selectedScript.content.slice(0, 200)}
                  {selectedScript.content.length > 200 && '...'}
                </div>
              </div>
              {selectedScript.description && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                  <span className="text-muted-foreground text-xs">
                    {selectedScript.description}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recommendations Display */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <Separator />
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Betting Recommendations
              </h3>
              <Badge variant="outline">{recommendations.length} recommendations</Badge>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {recommendations.map((rec, index) => (
                  <Card 
                    key={index} 
                    className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedRecommendation === `${rec.matchup}-${rec.betType}-${rec.selection}` 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : ''
                    }`}
                    onClick={() => setSelectedRecommendation(`${rec.matchup}-${rec.betType}-${rec.selection}`)}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="font-medium">{rec.matchup}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{rec.betType}</Badge>
                          <Badge 
                            variant={rec.confidence >= 8 ? 'default' : rec.confidence >= 6 ? 'secondary' : 'destructive'}
                          >
                            {rec.confidence}/10
                          </Badge>
                        </div>
                      </div>

                      {/* Bet Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Selection</p>
                          <p className="font-medium">{rec.selection}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Line/Total</p>
                          <p className="font-medium">{rec.line || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Odds</p>
                          <p className="font-medium">{rec.oddsAmerican} ({rec.oddsDecimal.toFixed(2)})</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stake</p>
                          <p className="font-medium text-primary">${rec.stake}</p>
                        </div>
                      </div>

                      {/* Potential Win */}
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm text-muted-foreground">Potential Win:</span>
                        <span className="font-medium text-green-600">${rec.potentialWin.toFixed(2)}</span>
                      </div>

                      {/* Script Summary */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Script Summary:</h5>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                          {rec.scriptSummary}
                        </p>
                      </div>

                      {/* Justification */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Justification:</h5>
                        <p className="text-sm text-muted-foreground">
                          {rec.justification}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Log Pick Section */}
            {recommendations.length > 0 && (
              <Card className="p-4 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Log Selected Pick</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedRecommendation 
                        ? 'Click "Log Pick" to save this recommendation to your betting log'
                        : 'Select a recommendation above to log it'
                      }
                    </p>
                  </div>
                  
                  <Button
                    onClick={logSelectedPick}
                    disabled={!selectedRecommendation}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Log Pick
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* No Data State */}
        {!hasRequiredData && (
          <Card className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Script Cannot Execute</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To execute the betting script, please:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Select matches from the upload panel</li>
              <li>2. Generate CIS analysis</li>
              <li>3. Ensure betting script rules are loaded</li>
            </ul>
          </Card>
        )}

        {/* Script Info */}
        <Card className="p-4 bg-muted/30">
          <div className="text-xs space-y-2">
            <div className="font-medium flex items-center gap-2">
              <Calculator className="h-3 w-3" />
              Script Features:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
              <div>• Auto-staking based on confidence</div>
              <div>• Risk management rules enforcement</div>
              <div>• League-specific betting strategies</div>
              <div>• Real-time odds validation</div>
              <div>• Bankroll percentage calculations</div>
              <div>• Multi-market recommendations</div>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
}
