
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Archive, 
  Download, 
  Filter, 
  RefreshCw, 
  Edit3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  FileText,
  Plus
} from 'lucide-react';
import { Pick, FilterOptions, SUPPORTED_SPORTS, BET_TYPES } from '@/lib/types';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

interface PickLoggerPanelProps {
  refreshTrigger: number;
}

export default function PickLoggerPanel({ refreshTrigger }: PickLoggerPanelProps) {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [filteredPicks, setFilteredPicks] = useState<Pick[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [editingPick, setEditingPick] = useState<Pick | null>(null);
  const [bankrollStats, setBankrollStats] = useState({
    current: 0,
    totalWagered: 0,
    totalWon: 0,
    totalLoss: 0,
    roi: 0,
    winRate: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPicks();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [picks, filters]);

  const fetchPicks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/picks');
      if (!response.ok) throw new Error('Failed to fetch picks');
      
      const data = await response.json();
      setPicks(data.picks || []);
      setBankrollStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching picks:', error);
      toast({
        title: 'Fetch Failed',
        description: 'Failed to load picks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...picks];

    if (filters.sport) {
      filtered = filtered.filter(pick => pick.sport === filters.sport);
    }
    
    if (filters.league) {
      filtered = filtered.filter(pick => pick.league === filters.league);
    }
    
    if (filters.betType) {
      filtered = filtered.filter(pick => pick.betType === filters.betType);
    }
    
    if (filters.result) {
      filtered = filtered.filter(pick => pick.result === filters.result);
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(pick => 
        new Date(pick.date) >= new Date(filters.dateFrom!)
      );
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(pick => 
        new Date(pick.date) <= new Date(filters.dateTo!)
      );
    }

    setFilteredPicks(filtered);
  };

  const updatePickResult = async (pickId: string, updates: Partial<Pick>) => {
    try {
      const response = await fetch(`/api/picks/${pickId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update pick');

      await fetchPicks(); // Refresh data
      setEditingPick(null);
      
      toast({
        title: 'Pick Updated',
        description: 'Pick has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating pick:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update pick. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const exportToCsv = () => {
    if (filteredPicks.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'Please ensure there are picks to export.',
        variant: 'destructive',
      });
      return;
    }

    const csvData = filteredPicks.map(pick => ({
      'Entry ID': pick.entryId,
      'Date': new Date(pick.date).toLocaleDateString(),
      'Sport': pick.sport,
      'League': pick.league,
      'Event': pick.event,
      'Bet Type': pick.betType,
      'Selection': pick.selection,
      'Line/Total': pick.line || 'N/A',
      'American Odds': pick.oddsAmerican,
      'Decimal Odds': pick.oddsDecimal?.toFixed(2) || 'N/A',
      'Stake': `$${pick.stake}`,
      'Potential Win': pick.potentialWin ? `$${pick.potentialWin.toFixed(2)}` : 'N/A',
      'Result': pick.result,
      'Actual Result': pick.actualResult || 'N/A',
      'Profit/Loss': pick.profitLoss ? `$${pick.profitLoss.toFixed(2)}` : 'N/A',
      'Running Bankroll': pick.runningBankroll ? `$${pick.runningBankroll.toFixed(2)}` : 'N/A',
      'Bankroll Change': pick.bankrollChange ? `$${pick.bankrollChange.toFixed(2)}` : 'N/A',
      'ROI': pick.roi ? `${pick.roi.toFixed(2)}%` : 'N/A',
      'Confidence': pick.confidence ? `${pick.confidence}/10` : 'N/A',
      'Tags': pick.tags || 'N/A',
      'Notes': pick.notes || 'N/A',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `betting_log_${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: 'Export Successful',
      description: `Exported ${filteredPicks.length} picks to CSV.`,
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'Win': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Loss': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Push': return <Target className="h-4 w-4 text-yellow-600" />;
      case 'Void': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Win': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'Loss': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'Push': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'Void': return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const EditPickDialog = ({ pick, onSave, onClose }: { pick: Pick; onSave: (updates: Partial<Pick>) => void; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      result: pick.result,
      actualResult: pick.actualResult || '',
      profitLoss: pick.profitLoss?.toString() || '',
      runningBankroll: pick.runningBankroll?.toString() || '',
      notes: pick.notes || '',
    });

    const handleSave = () => {
      const updates: Partial<Pick> = {
        result: formData.result as 'Pending' | 'Win' | 'Loss' | 'Push' | 'Void',
        actualResult: formData.actualResult,
        profitLoss: formData.profitLoss ? parseFloat(formData.profitLoss) : undefined,
        runningBankroll: formData.runningBankroll ? parseFloat(formData.runningBankroll) : undefined,
        notes: formData.notes,
      };

      // Calculate derived fields
      if (updates.profitLoss !== undefined) {
        updates.bankrollChange = updates.profitLoss;
        updates.roi = (updates.profitLoss / pick.stake) * 100;
      }

      onSave(updates);
    };

    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Pick Result</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Result</Label>
            <Select value={formData.result} onValueChange={(value) => setFormData({...formData, result: value as 'Pending' | 'Win' | 'Loss' | 'Push' | 'Void'})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Win">Win</SelectItem>
                <SelectItem value="Loss">Loss</SelectItem>
                <SelectItem value="Push">Push</SelectItem>
                <SelectItem value="Void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Actual Result</Label>
            <Input
              value={formData.actualResult}
              onChange={(e) => setFormData({...formData, actualResult: e.target.value})}
              placeholder="e.g., 3-1, Player scored 2 goals"
            />
          </div>

          <div>
            <Label>Profit/Loss ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.profitLoss}
              onChange={(e) => setFormData({...formData, profitLoss: e.target.value})}
              placeholder="Enter profit or loss amount"
            />
          </div>

          <div>
            <Label>Running Bankroll ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.runningBankroll}
              onChange={(e) => setFormData({...formData, runningBankroll: e.target.value})}
              placeholder="Current bankroll after this bet"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes about this bet"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-primary" />
          Advanced Pick Logger & Export System
          {filteredPicks.length !== picks.length && (
            <Badge variant="outline">
              {filteredPicks.length} of {picks.length} picks
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comprehensive betting log with advanced filtering, manual result updates, and export capabilities
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Bankroll Statistics */}
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">${bankrollStats.current?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-muted-foreground">Current Bankroll</p>
            </div>
            <div className="text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-lg font-bold">${bankrollStats.totalWagered?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-muted-foreground">Total Wagered</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-lg font-bold">${bankrollStats.totalWon?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-muted-foreground">Total Won</p>
            </div>
            <div className="text-center">
              <TrendingDown className="h-6 w-6 mx-auto mb-1 text-red-600" />
              <p className="text-lg font-bold">${bankrollStats.totalLoss?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-muted-foreground">Total Loss</p>
            </div>
            <div className="text-center">
              <Target className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-lg font-bold">{bankrollStats.roi?.toFixed(1) || '0.0'}%</p>
              <p className="text-xs text-muted-foreground">ROI</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
              <p className="text-lg font-bold">{bankrollStats.winRate?.toFixed(1) || '0.0'}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <h4 className="font-medium">Advanced Filters</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <Label className="text-xs">Sport</Label>
              <Select value={filters.sport || 'all'} onValueChange={(value) => setFilters({...filters, sport: value === 'all' ? undefined : value})}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {SUPPORTED_SPORTS.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Bet Type</Label>
              <Select value={filters.betType || 'all'} onValueChange={(value) => setFilters({...filters, betType: value === 'all' ? undefined : value})}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {BET_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Result</Label>
              <Select value={filters.result || 'all'} onValueChange={(value) => setFilters({...filters, result: value === 'all' ? undefined : value})}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Win">Win</SelectItem>
                  <SelectItem value="Loss">Loss</SelectItem>
                  <SelectItem value="Push">Push</SelectItem>
                  <SelectItem value="Void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Date From</Label>
              <Input
                type="date"
                className="h-8"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value || undefined})}
              />
            </div>

            <div>
              <Label className="text-xs">Date To</Label>
              <Input
                type="date"
                className="h-8"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value || undefined})}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </Button>
              <Button size="sm" onClick={exportToCsv} className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          </div>
        </Card>

        {/* Picks Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Betting Log
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPicks}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge variant="secondary">{filteredPicks.length} picks</Badge>
            </div>
          </div>

          {filteredPicks.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {filteredPicks.map((pick) => (
                  <Card key={pick.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {pick.entryId.slice(-8)}
                          </Badge>
                          <span className="font-medium">{pick.event}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{pick.sport}</Badge>
                          <Badge className={getResultColor(pick.result)}>
                            {getResultIcon(pick.result)}
                            {pick.result}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingPick(pick)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            {editingPick?.id === pick.id && (
                              <EditPickDialog
                                pick={pick}
                                onSave={(updates) => updatePickResult(pick.id, updates)}
                                onClose={() => setEditingPick(null)}
                              />
                            )}
                          </Dialog>
                        </div>
                      </div>

                      {/* Bet Details */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{new Date(pick.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Bet Type</p>
                          <p className="font-medium">{pick.betType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Selection</p>
                          <p className="font-medium">{pick.selection}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Odds</p>
                          <p className="font-medium">{pick.oddsAmerican}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stake</p>
                          <p className="font-medium text-primary">${pick.stake}</p>
                        </div>
                      </div>

                      {/* Financial Details */}
                      {pick.result !== 'Pending' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-2 bg-muted/30 rounded">
                          <div>
                            <p className="text-muted-foreground">Profit/Loss</p>
                            <p className={`font-medium ${pick.profitLoss && pick.profitLoss > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pick.profitLoss ? `$${pick.profitLoss.toFixed(2)}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">ROI</p>
                            <p className={`font-medium ${pick.roi && pick.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pick.roi ? `${pick.roi.toFixed(1)}%` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Bankroll</p>
                            <p className="font-medium">
                              {pick.runningBankroll ? `$${pick.runningBankroll.toFixed(2)}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Confidence</p>
                            <p className="font-medium">
                              {pick.confidence ? `${pick.confidence}/10` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      {(pick.line || pick.actualResult || pick.notes) && (
                        <div className="space-y-2 text-sm">
                          {pick.line && (
                            <div>
                              <span className="text-muted-foreground">Line: </span>
                              <span>{pick.line}</span>
                            </div>
                          )}
                          {pick.actualResult && (
                            <div>
                              <span className="text-muted-foreground">Actual Result: </span>
                              <span>{pick.actualResult}</span>
                            </div>
                          )}
                          {pick.notes && (
                            <div>
                              <span className="text-muted-foreground">Notes: </span>
                              <span className="italic">{pick.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card className="p-6 text-center">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Picks Found</h3>
              <p className="text-sm text-muted-foreground">
                {picks.length === 0 
                  ? 'No picks have been logged yet. Start by selecting matches and generating bets.'
                  : 'No picks match the current filters. Try adjusting your filter criteria.'
                }
              </p>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
