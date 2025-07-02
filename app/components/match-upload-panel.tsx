
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  CheckSquare, 
  Calendar,
  Trophy,
  Users,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Match, SUPPORTED_SPORTS, ExcelSheetData } from '@/lib/types';

interface MatchUploadPanelProps {
  onMatchesSelected: (matches: Match[]) => void;
}

export default function MatchUploadPanel({ onMatchesSelected }: MatchUploadPanelProps) {
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [uploadedData, setUploadedData] = useState<ExcelSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();

  const filterTodaysMatches = (matches: Match[]): Match[] => {
    const today = new Date().toISOString().split('T')[0];
    return matches.filter(match => {
      const matchDate = new Date(match.date).toISOString().split('T')[0];
      return matchDate === today;
    });
  };

  const parseExcelFile = async (file: File): Promise<ExcelSheetData> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    
    if (workbook.SheetNames.length < 3) {
      throw new Error('Excel file must contain exactly 3 sheets: Betting Script, Fixtures/Results, and Stats');
    }

    const [scriptSheetName, fixturesSheetName, statsSheetName] = workbook.SheetNames.slice(0, 3);
    
    const bettingScript = XLSX.utils.sheet_to_json(workbook.Sheets[scriptSheetName]);
    const fixtures = XLSX.utils.sheet_to_json(workbook.Sheets[fixturesSheetName]);
    const stats = XLSX.utils.sheet_to_json(workbook.Sheets[statsSheetName]);

    return { bettingScript, fixtures, stats };
  };

  const transformFixturesToMatches = (fixtures: any[], sport: string): Match[] => {
    return fixtures.map((row, index) => ({
      id: `match-${Date.now()}-${index}`,
      date: row.Date || row.date || row.MatchDate || new Date().toISOString().split('T')[0],
      league: row.League || row.league || row.Competition || sport,
      sport: sport,
      homeTeam: row.Home || row.HomeTeam || row.home_team || row['Home Team'] || 'Unknown',
      awayTeam: row.Away || row.AwayTeam || row.away_team || row['Away Team'] || 'Unknown',
      venue: row.Venue || row.venue || row.Stadium || '',
      homeXG: parseFloat(row.HomeXG || row.home_xg || row['Home xG'] || '0') || undefined,
      awayXG: parseFloat(row.AwayXG || row.away_xg || row['Away xG'] || '0') || undefined,
      homeForm: row.HomeForm || row.home_form || row['Home Form'] || '',
      awayForm: row.AwayForm || row.away_form || row['Away Form'] || '',
      homeInjuries: row.HomeInjuries || row.home_injuries || row['Home Injuries'] || '',
      awayInjuries: row.AwayInjuries || row.away_injuries || row['Away Injuries'] || '',
      trends: row.Trends || row.trends || row.Notes || '',
      selected: false,
      fixtureData: row,
    }));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!selectedSport) {
      toast({
        title: 'Sport Selection Required',
        description: 'Please select a sport/league before uploading files.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setFileName(file.name);
    
    try {
      let parsedData: ExcelSheetData;

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedData = await parseExcelFile(file);
      } else {
        throw new Error('Only Excel files (.xlsx, .xls) with 3 sheets are supported for enhanced analysis');
      }

      // Store the uploaded data
      setUploadedData(parsedData);

      // Transform fixtures to matches and filter for today
      const allMatches = transformFixturesToMatches(parsedData.fixtures, selectedSport);
      const todaysMatches = filterTodaysMatches(allMatches);

      // Enhance matches with stats data
      const enhancedMatches = todaysMatches.map(match => ({
        ...match,
        statsData: parsedData.stats,
        scriptData: parsedData.bettingScript,
      }));

      setMatches(enhancedMatches);

      // Save uploaded data to database
      await fetch('/api/upload-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          sport: selectedSport,
          league: selectedSport,
          bettingScript: parsedData.bettingScript,
          fixtures: parsedData.fixtures,
          stats: parsedData.stats,
        }),
      });

      toast({
        title: 'File Uploaded Successfully',
        description: `Imported ${enhancedMatches.length} matches for today from ${parsedData.fixtures.length} total fixtures`,
      });
    } catch (error) {
      console.error('File parsing error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to parse the uploaded file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSport, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const handleMatchToggle = (matchId: string) => {
    const updatedMatches = matches.map(match =>
      match.id === matchId ? { ...match, selected: !match.selected } : match
    );
    setMatches(updatedMatches);
    
    const selectedMatches = updatedMatches.filter(match => match.selected);
    onMatchesSelected(selectedMatches);
  };

  const handleSelectAll = () => {
    const allSelected = matches.every(match => match.selected);
    const updatedMatches = matches.map(match => ({ ...match, selected: !allSelected }));
    setMatches(updatedMatches);
    
    const selectedMatches = updatedMatches.filter(match => match.selected);
    onMatchesSelected(selectedMatches);
  };

  const handleClearAll = () => {
    setMatches([]);
    setUploadedData(null);
    setFileName('');
    onMatchesSelected([]);
  };

  const selectedCount = matches.filter(match => match.selected).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Dynamic Multi-League Excel Upload System
          {matches.length > 0 && (
            <Badge variant="secondary">
              {selectedCount} of {matches.length} selected
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload Excel files with 3-sheet structure: Betting Script, Fixtures/Results, and Stats data
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sport/League Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Sport/League *</label>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a sport or league..." />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_SPORTS.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    {sport}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : selectedSport 
                ? 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                : 'border-muted-foreground/10 bg-muted/10 cursor-not-allowed'
            }
          `}
        >
          <input {...getInputProps()} disabled={!selectedSport} />
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop the Excel file here' : 'Upload League-Specific Excel File'}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedSport 
                ? `Upload .xlsx or .xls file for ${selectedSport}`
                : 'Please select a sport/league first'
              }
            </p>
            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
              <p>Required 3-sheet structure:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">Sheet 1: Betting Script</Badge>
                <Badge variant="outline">Sheet 2: Fixtures/Results</Badge>
                <Badge variant="outline">Sheet 3: Stats</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Processing {fileName}...</span>
            </div>
          </Card>
        )}

        {/* File Info and Data Summary */}
        {uploadedData && !isLoading && (
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span className="font-medium">File Processed: {fileName}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium">{uploadedData.bettingScript?.length || 0}</p>
                <p className="text-muted-foreground">Script Rules</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{uploadedData.fixtures?.length || 0}</p>
                <p className="text-muted-foreground">Total Fixtures</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{uploadedData.stats?.length || 0}</p>
                <p className="text-muted-foreground">Stats Entries</p>
              </div>
            </div>
          </Card>
        )}

        {/* Today's Matches */}
        {matches.length > 0 && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <h3 className="font-medium">Today's Matches</h3>
                <Badge variant="secondary">{matches.length} available</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  {matches.every(match => match.selected) ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {matches.map((match) => (
                <Card 
                  key={match.id} 
                  className={`p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                    match.selected ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleMatchToggle(match.id)}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={match.selected}
                      onChange={() => handleMatchToggle(match.id)}
                      className="pointer-events-none"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {match.homeTeam} vs {match.awayTeam}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Trophy className="h-3 w-3" />
                          {match.league}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>{match.date}</span>
                          {match.venue && <span>@ {match.venue}</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          {(match.homeXG || match.awayXG) && (
                            <span>xG: {match.homeXG?.toFixed(1) || 'N/A'} - {match.awayXG?.toFixed(1) || 'N/A'}</span>
                          )}
                          {(match.homeForm || match.awayForm) && (
                            <span>Form: {match.homeForm || 'N/A'} | {match.awayForm || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {selectedCount > 0 && (
              <Card className="p-4 bg-primary/5">
                <div className="flex items-center gap-2 text-primary">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedCount} match{selectedCount !== 1 ? 'es' : ''} selected for analysis
                  </span>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* No matches for today */}
        {uploadedData && matches.length === 0 && !isLoading && (
          <Card className="p-6 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Matches Today</h3>
            <p className="text-sm text-muted-foreground">
              No matches found for today's date. The system automatically filters fixtures to show only today's games.
            </p>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
