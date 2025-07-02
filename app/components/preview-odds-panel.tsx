
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  DollarSign, 
  Save, 
  AlertCircle, 
  TrendingUp,
  Copy,
  FileText,
  Calculator
} from 'lucide-react';

interface PreviewOddsPanelProps {
  onDataSaved: (data: { preview: string; odds: string }) => void;
  selectedMatchesCount: number;
  onStatsInput?: (stats: string) => void;
  selectedSchedule?: any;
  injuryValidation?: {
    detected: boolean;
    keywords: string[];
    confidence: number;
    suggestions: string[];
  };
}

export default function PreviewOddsPanel({ 
  onDataSaved, 
  selectedMatchesCount, 
  onStatsInput, 
  selectedSchedule, 
  injuryValidation 
}: PreviewOddsPanelProps) {
  const [preview, setPreview] = useState('');
  const [odds, setOdds] = useState('');
  const [statsInput, setStatsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!preview.trim() && !odds.trim() && !statsInput.trim()) {
      toast({
        title: 'No Data to Save',
        description: 'Please enter preview analysis, odds data, or matchup stats before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Simulate saving delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onDataSaved({ preview: preview.trim(), odds: odds.trim() });
      onStatsInput?.(statsInput.trim());
      
      toast({
        title: 'Data Saved Successfully',
        description: 'Preview analysis, odds data, and stats have been saved for analysis.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save the data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setPreview('');
    setOdds('');
    setStatsInput('');
    onDataSaved({ preview: '', odds: '' });
    onStatsInput?.('');
    toast({
      title: 'Data Cleared',
      description: 'All preview, odds, and stats data has been cleared.',
    });
  };

  const parseOddspeediaFormat = () => {
    if (!odds.trim()) {
      toast({
        title: 'No Odds Data',
        description: 'Please paste odds data first.',
        variant: 'destructive',
      });
      return;
    }

    // Simple parsing logic for common Oddspedia formats
    const lines = odds.split('\n').filter(line => line.trim());
    const parsedData: string[] = [];

    lines.forEach(line => {
      // Look for patterns like "Team 1.85 | Team 2.95" or "Over 2.5 1.91"
      const oddsPattern = /(\d+\.?\d*)/g;
      const matches = line.match(oddsPattern);
      if (matches && matches.length >= 1) {
        parsedData.push(`${line} → Decimal odds detected: ${matches.join(', ')}`);
      }
    });

    if (parsedData.length > 0) {
      const parsedText = `PARSED ODDS DATA:\n${parsedData.join('\n')}\n\nORIGINAL:\n${odds}`;
      setOdds(parsedText);
      toast({
        title: 'Odds Parsed',
        description: `Detected ${parsedData.length} lines with odds data.`,
      });
    } else {
      toast({
        title: 'No Odds Found',
        description: 'Could not detect odds format in the provided data.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to Clipboard',
        description: `${type} data copied successfully.`,
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
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Pre-Match Preview & Raw Odds Input
          {selectedMatchesCount > 0 && (
            <Badge variant="secondary">
              {selectedMatchesCount} match{selectedMatchesCount !== 1 ? 'es' : ''} selected
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Input detailed match analysis and raw odds data from betting platforms
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Match Selection Status */}
        {selectedMatchesCount === 0 && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                No matches selected. Please select matches from the upload panel first.
              </span>
            </div>
          </Card>
        )}

        {/* Pre-Match Analysis Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium">Pre-Match Analysis & Preview</label>
            </div>
            {preview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(preview, 'Preview')}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
          </div>
          
          <Textarea
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            placeholder="Enter detailed pre-match analysis, team form, injury reports, historical performance, tactical insights..."
            className="min-h-[120px] resize-y"
          />
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Include: Team form, injuries, head-to-head, home/away performance, tactical analysis
          </div>
        </div>

        <Separator />

        {/* Selected Schedule Display */}
        {selectedSchedule && (
          <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Selected Match</span>
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {selectedSchedule.homeTeam} vs {selectedSchedule.awayTeam} • {selectedSchedule.league}
                  {selectedSchedule.time && ` • ${selectedSchedule.time}`}
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {new Date(selectedSchedule.date).toLocaleDateString()}
              </Badge>
            </div>
          </Card>
        )}

        {/* Matchup Stats Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium">Paste Matchup Stats (Manual Input)</label>
            </div>
            {statsInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(statsInput, 'Stats')}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
          </div>
          
          <Textarea
            value={statsInput}
            onChange={(e) => setStatsInput(e.target.value)}
            placeholder="Paste matchup statistics here...

Examples:
• Team A: 15 wins, 8 losses this season
• Head-to-head: Last 5 meetings - Team A 3-2 Team B  
• Home form: Team A 8-2 at home
• Away form: Team B 6-4 on the road
• Goals scored: Team A avg 2.1, Team B avg 1.8
• Goals conceded: Team A avg 1.2, Team B avg 1.5
• Key player stats, recent form, injuries, etc.

Or any other relevant statistical information..."
            className="min-h-[120px] resize-y"
          />
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            Replaces Excel Sheet 3 parsing - Add any statistical data, bullet points, or structured info
          </div>
        </div>

        <Separator />

        {/* Raw Odds Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium">Raw Odds Data (Oddspedia Format)</label>
            </div>
            <div className="flex items-center gap-1">
              {odds && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(odds, 'Odds')}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={parseOddspeediaFormat}
                className="text-xs"
                disabled={!odds.trim()}
              >
                <Calculator className="h-3 w-3 mr-1" />
                Parse
              </Button>
            </div>
          </div>
          
          <Textarea
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            placeholder="Paste raw odds data from Oddspedia or other platforms...

Examples:
Manchester United vs Liverpool
1X2: 2.10 | 3.40 | 3.20
Over/Under 2.5: 1.85 | 1.95
Both Teams to Score: 1.65 | 2.20

Player Props:
Cristiano Ronaldo Anytime Scorer: 2.50
Total Goals O/U 0.5: 1.40 | 2.80"
            className="min-h-[120px] resize-y font-mono text-sm"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Supports decimal (1.85) and American (-110) odds</span>
            </div>
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Include line movements and closing odds</span>
            </div>
          </div>
        </div>

        {/* Injury Validation Display */}
        {injuryValidation && (
          <Card className={`p-4 ${
            injuryValidation.detected 
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
              : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {injuryValidation.detected ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Injury Data Detected
                    </span>
                    <Badge variant="default" className="bg-green-600">
                      {injuryValidation.confidence}% confidence
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      ⚠️ No Injury Data Detected
                    </span>
                  </>
                )}
              </div>
              
              {injuryValidation.detected && injuryValidation.keywords.length > 0 && (
                <div className="text-sm text-green-700 dark:text-green-300">
                  Keywords found: {injuryValidation.keywords.join(', ')}
                </div>
              )}
              
              {!injuryValidation.detected && injuryValidation.suggestions.length > 0 && (
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <div className="font-medium">Suggestions:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {injuryValidation.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-muted-foreground">
            {preview.length + odds.length + statsInput.length > 0 && (
              <span>{preview.length + odds.length + statsInput.length} characters entered</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!preview && !odds && !statsInput}
            >
              Clear All
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isSaving || (!preview.trim() && !odds.trim() && !statsInput.trim())}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tips Section */}
        <Card className="p-3 bg-muted/30">
          <div className="text-xs space-y-2">
            <div className="font-medium flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              V2 Pro Tips:
            </div>
            <ul className="space-y-1 text-muted-foreground pl-4">
              <li>• Select matches from schedules, then add preview and stats manually</li>
              <li>• Stats input replaces Excel Sheet 3 - paste any relevant data</li>
              <li>• Include injury mentions to pass validation (auto-detected)</li>
              <li>• Copy-paste odds directly from Oddspedia for automatic parsing</li>
              <li>• Include line movements to identify sharp money</li>
              <li>• All data flows into CIS generation and betting script execution</li>
            </ul>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
}
