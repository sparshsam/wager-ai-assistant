
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Zap, 
  Copy, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Users,
  Shield,
  Target,
  BarChart3,
  Clock
} from 'lucide-react';
import { Match } from '@/lib/types';

interface CISGeneratorPanelProps {
  selectedMatches: Match[];
  selectedSchedule?: any;
  previewData: { preview: string; odds: string };
  statsInput?: string;
  onCISGenerated: (cis: string) => void;
  injuryValidation?: {
    detected: boolean;
    keywords: string[];
    confidence: number;
    suggestions: string[];
  };
}

interface CISSection {
  title: string;
  content: string;
  icon: React.ReactNode;
}

export default function CISGeneratorPanel({ 
  selectedMatches,
  selectedSchedule,
  previewData, 
  statsInput,
  onCISGenerated,
  injuryValidation
}: CISGeneratorPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [cisResult, setCisResult] = useState('');
  const [sectionsData, setSectionsData] = useState<CISSection[]>([]);
  const { toast } = useToast();

  // V2 Enhanced validation logic
  const canGenerate = (selectedSchedule || selectedMatches.length > 0) && 
                     (previewData.preview || previewData.odds || statsInput);
  
  const hasRequiredData = selectedSchedule && previewData.preview && statsInput;

  const generateCIS = async () => {
    if (!canGenerate) {
      toast({
        title: 'Insufficient Data',
        description: 'Please select a match and provide preview data or stats first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // V2 Enhanced data preparation for AI analysis
      const analysisData = {
        // Primary match data from selected schedule
        selectedMatch: selectedSchedule ? {
          matchup: `${selectedSchedule.homeTeam} vs ${selectedSchedule.awayTeam}`,
          league: selectedSchedule.league,
          sport: selectedSchedule.sport,
          date: selectedSchedule.date,
          time: selectedSchedule.time,
          venue: selectedSchedule.venue,
          status: selectedSchedule.status,
          notes: selectedSchedule.notes,
        } : null,
        
        // Legacy support for backward compatibility
        selectedMatches: selectedMatches.map(match => ({
          matchup: `${match.homeTeam} vs ${match.awayTeam}`,
          league: match.league,
          sport: match.sport,
          date: match.date,
          venue: match.venue,
        })),
        
        // Manual input data (replaces Excel sheets)
        previewAnalysis: previewData.preview,
        oddsData: previewData.odds,
        manualStats: statsInput, // Replaces Excel Sheet 3
        
        // Enhanced validation context
        injuryContext: injuryValidation ? {
          detected: injuryValidation.detected,
          keywords: injuryValidation.keywords,
          confidence: injuryValidation.confidence,
          suggestions: injuryValidation.suggestions,
        } : null,
        
        // Generation metadata
        dataSource: 'v2_manual_input',
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/generate-cis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate CIS analysis');
      }

      const result = await response.json();
      const generatedCIS = result.cis;
      
      setCisResult(generatedCIS);
      onCISGenerated(generatedCIS);

      // Parse sections for better display
      const sections = parseCISIntoSections(generatedCIS);
      setSectionsData(sections);

      toast({
        title: 'CIS Generated Successfully',
        description: 'Comprehensive Intelligence Summary has been generated.',
      });
    } catch (error) {
      console.error('CIS generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate CIS analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const parseCISIntoSections = (cis: string): CISSection[] => {
    const sections: CISSection[] = [];
    
    // Define section patterns and their corresponding icons
    const sectionPatterns = [
      { title: 'Key Stats', pattern: /(?:KEY STATS|STATISTICS|STATISTICAL ANALYSIS)[:\n](.*?)(?=\n\n|\n[A-Z]{2,}|$)/is, icon: <BarChart3 className="h-4 w-4" /> },
      { title: 'Form & Pattern', pattern: /(?:FORM|PATTERNS?|RECENT FORM)[:\n](.*?)(?=\n\n|\n[A-Z]{2,}|$)/is, icon: <TrendingUp className="h-4 w-4" /> },
      { title: 'Injury Insights', pattern: /(?:INJUR(?:Y|IES)|TEAM NEWS|AVAILABILITY)[:\n](.*?)(?=\n\n|\n[A-Z]{2,}|$)/is, icon: <Users className="h-4 w-4" /> },
      { title: 'Opportunities & Risks', pattern: /(?:OPPORTUNIT(?:Y|IES)|RISKS?|THREATS?)[:\n](.*?)(?=\n\n|\n[A-Z]{2,}|$)/is, icon: <Target className="h-4 w-4" /> },
      { title: 'Market Evaluation', pattern: /(?:MARKET|ODDS|BETTING|VALUE)[:\n](.*?)(?=\n\n|\n[A-Z]{2,}|$)/is, icon: <Shield className="h-4 w-4" /> },
    ];

    sectionPatterns.forEach(({ title, pattern, icon }) => {
      const match = cis.match(pattern);
      if (match && match[1]) {
        sections.push({
          title,
          content: match[1].trim(),
          icon,
        });
      }
    });

    // If no structured sections found, create a general analysis section
    if (sections.length === 0) {
      sections.push({
        title: 'Comprehensive Analysis',
        content: cis,
        icon: <Brain className="h-4 w-4" />,
      });
    }

    return sections;
  };

  const copyToClipboard = async () => {
    if (!cisResult) return;
    
    try {
      await navigator.clipboard.writeText(cisResult);
      toast({
        title: 'Copied to Clipboard',
        description: 'CIS analysis copied successfully.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Enhanced CIS Generator v2.0
          {selectedSchedule && (
            <Badge variant="secondary">
              {selectedSchedule.league} • {selectedSchedule.homeTeam} vs {selectedSchedule.awayTeam}
            </Badge>
          )}
          {!selectedSchedule && selectedMatches.length > 0 && (
            <Badge variant="outline">
              {selectedMatches.length} legacy match{selectedMatches.length !== 1 ? 'es' : ''}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate structured five-section analysis using manual input data and enhanced validation
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* V2 Data Sources Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={`p-3 text-center ${selectedSchedule ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30'}`}>
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{selectedSchedule ? 'Selected' : 'None'}</p>
            <p className="text-xs text-muted-foreground">Schedule</p>
          </Card>
          
          <Card className={`p-3 text-center ${previewData.preview ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30'}`}>
            <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{previewData.preview ? 'Added' : 'Missing'}</p>
            <p className="text-xs text-muted-foreground">Preview</p>
          </Card>
          
          <Card className={`p-3 text-center ${statsInput ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30'}`}>
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{statsInput ? 'Added' : 'Missing'}</p>
            <p className="text-xs text-muted-foreground">Manual Stats</p>
          </Card>
          
          <Card className={`p-3 text-center ${injuryValidation?.detected ? 'bg-green-50 dark:bg-green-950/20' : 'bg-yellow-50 dark:bg-yellow-950/20'}`}>
            <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">
              {injuryValidation?.detected ? '✓' : '⚠️'}
            </p>
            <p className="text-xs text-muted-foreground">Injury Data</p>
          </Card>
        </div>

        {/* V2 Enhanced Status */}
        {!hasRequiredData && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                For optimal CIS generation: Select a match, add preview analysis, and input matchup stats
              </span>
            </div>
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Missing data will result in generic analysis instead of comprehensive intelligence summary
            </div>
          </Card>
        )}

        {injuryValidation && !injuryValidation.detected && previewData.preview && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                ⚠️ No injury data detected in preview. Consider adding injury context for complete analysis.
              </span>
            </div>
          </Card>
        )}

        {/* Generation Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasRequiredData
              ? '✅ All required data available - Ready for optimal CIS generation'
              : canGenerate 
                ? '⚠️ Partial data available - CIS will be generated with available information'
                : '❌ Please select a match and provide preview data to begin'
            }
          </div>
          
          <div className="flex items-center gap-2">
            {cisResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            )}
            
            <Button
              onClick={generateCIS}
              disabled={!canGenerate || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Generate CIS
                </>
              )}
            </Button>
          </div>
        </div>

        {/* CIS Results Display */}
        {sectionsData.length > 0 && (
          <div className="space-y-4">
            <Separator />
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Comprehensive Intelligence Summary
              </h3>
              <Badge variant="outline">{sectionsData.length} sections</Badge>
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {sectionsData.map((section, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {section.icon}
                      <h4 className="font-medium text-primary">{section.title}</h4>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {section.content}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Raw CIS Output (if no structured sections) */}
        {cisResult && sectionsData.length === 0 && (
          <div className="space-y-4">
            <Separator />
            
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Generated Analysis
            </h3>

            <Card className="p-4">
              <ScrollArea className="h-[400px]">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {cisResult}
                  </pre>
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}

        {/* No Data State */}
        {!canGenerate && (
          <Card className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To generate a comprehensive analysis, please:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Select matches from the upload panel, OR</li>
              <li>• Provide preview analysis in the preview panel, OR</li>
              <li>• Add odds data for manual analysis</li>
            </ul>
          </Card>
        )}

        {/* Analysis Structure Info */}
        <Card className="p-4 bg-muted/30">
          <div className="text-xs space-y-2">
            <div className="font-medium flex items-center gap-2">
              <Target className="h-3 w-3" />
              CIS Structure:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
              <div>• Key Stats & Statistical Analysis</div>
              <div>• Form & Pattern Recognition</div>
              <div>• Injury Insights & Team News</div>
              <div>• Opportunities & Risk Assessment</div>
              <div>• Market Evaluation & Value Analysis</div>
              <div>• Professional Betting Recommendations</div>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
}
