
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { LeagueSchedule, ScheduleUploadResult, SUPPORTED_SPORTS } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import * as XLSX from 'xlsx';

interface LeagueSchedulesPanelProps {
  onScheduleSelected?: (schedule: LeagueSchedule) => void;
}

export default function LeagueSchedulesPanel({ onScheduleSelected }: LeagueSchedulesPanelProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<LeagueSchedule[]>([]);
  const [todaysMatches, setTodaysMatches] = useState<LeagueSchedule[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    homeTeam: '',
    awayTeam: '',
    league: '',
    sport: '',
    date: '',
    time: '',
    venue: ''
  });

  // Stats
  const [stats, setStats] = useState({
    totalSchedules: 0,
    todaysGames: 0,
    leaguesWithSchedules: 0
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetchSchedules();
    }
  }, [session]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
        setTodaysMatches(data.todaysMatches || []);
        setStats(data.stats || { totalSchedules: 0, todaysGames: 0, leaguesWithSchedules: 0 });
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validate and process the data
      const processedData = jsonData
        .filter((row: any) => row?.Date && row?.Home && row?.Away && row?.League)
        .map((row: any) => ({
          date: new Date(row.Date).toISOString(),
          homeTeam: String(row.Home).trim(),
          awayTeam: String(row.Away).trim(),
          league: String(row.League).trim(),
          sport: row.Sport ? String(row.Sport).trim() : 'Unknown',
          time: row.Time ? String(row.Time).trim() : undefined,
          venue: row.Venue ? String(row.Venue).trim() : undefined
        }));

      if (processedData.length === 0) {
        toast({
          title: 'No Valid Data',
          description: 'No valid schedule data found. Please check your Excel format.',
          variant: 'destructive',
        });
        return;
      }

      // Upload to backend
      const response = await fetch('/api/schedules/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          schedules: processedData
        }),
      });

      if (response.ok) {
        const result: ScheduleUploadResult = await response.json();
        toast({
          title: 'Upload Successful',
          description: `${result.successfulRows} schedules uploaded. ${result.todaysMatches} games today.`,
        });
        fetchSchedules();
      } else {
        const error = await response.json();
        toast({
          title: 'Upload Failed',
          description: error.message || 'Failed to upload schedules',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to process the Excel file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.homeTeam || !manualForm.awayTeam || !manualForm.league || !manualForm.date) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...manualForm,
          date: new Date(manualForm.date).toISOString(),
          sport: manualForm.sport || 'Unknown'
        }),
      });

      if (response.ok) {
        toast({
          title: 'Schedule Added',
          description: 'Match schedule has been added successfully',
        });
        setManualForm({
          homeTeam: '',
          awayTeam: '',
          league: '',
          sport: '',
          date: '',
          time: '',
          venue: ''
        });
        setShowManualEntry(false);
        fetchSchedules();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to add schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add schedule',
        variant: 'destructive',
      });
    }
  };

  const handleSelectMatch = (schedule: LeagueSchedule) => {
    onScheduleSelected?.(schedule);
    toast({
      title: 'Match Selected',
      description: `Selected: ${schedule.homeTeam} vs ${schedule.awayTeam}`,
    });
  };

  const deleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Schedule Deleted',
          description: 'Schedule has been removed',
        });
        fetchSchedules();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Date: '2025-01-01',
        Home: 'Team A',
        Away: 'Team B',
        League: 'Premier League',
        Sport: 'Soccer',
        Time: '15:00',
        Venue: 'Stadium Name'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule Template');
    XLSX.writeFile(workbook, 'schedule_template.xlsx');

    toast({
      title: 'Template Downloaded',
      description: 'Excel template has been downloaded',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              League Schedules Management
            </CardTitle>
            <CardDescription>
              Upload Excel schedules or add matches manually. Auto-filters today's games.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" size="sm" onClick={fetchSchedules} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.totalSchedules}</div>
            <div className="text-sm text-muted-foreground">Total Schedules</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.todaysGames}</div>
            <div className="text-sm text-muted-foreground">Today's Games</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.leaguesWithSchedules}</div>
            <div className="text-sm text-muted-foreground">Leagues Covered</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="schedule-upload" className="text-sm font-medium">
                Upload Excel Schedule (.xlsx)
              </Label>
              <div className="mt-2">
                <Input
                  id="schedule-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Required columns: Date, Home, Away, League. Optional: Sport, Time, Venue
              </p>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">or</div>
              <Button
                variant="outline"
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing Excel file...</span>
            </div>
          )}
        </div>

        {/* Manual Entry Form */}
        {showManualEntry && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Add Match Manually</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeTeam">Home Team *</Label>
                    <Input
                      id="homeTeam"
                      value={manualForm.homeTeam}
                      onChange={(e) => setManualForm({...manualForm, homeTeam: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="awayTeam">Away Team *</Label>
                    <Input
                      id="awayTeam"
                      value={manualForm.awayTeam}
                      onChange={(e) => setManualForm({...manualForm, awayTeam: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="league">League *</Label>
                    <Input
                      id="league"
                      value={manualForm.league}
                      onChange={(e) => setManualForm({...manualForm, league: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sport">Sport</Label>
                    <Select
                      value={manualForm.sport}
                      onValueChange={(value) => setManualForm({...manualForm, sport: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_SPORTS.map((sport) => (
                          <SelectItem key={sport} value={sport}>
                            {sport}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={manualForm.date}
                      onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={manualForm.time}
                      onChange={(e) => setManualForm({...manualForm, time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={manualForm.venue}
                    onChange={(e) => setManualForm({...manualForm, venue: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowManualEntry(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Today's Matches */}
        {todaysMatches.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Today's Matches ({todaysMatches.length})
            </h3>
            <div className="grid gap-3">
              {todaysMatches.map((match) => (
                <Card key={match.id} className="bg-green-50 border-green-200 hover:bg-green-100 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold">
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant="secondary">{match.league}</Badge>
                          <Badge variant="outline">{match.sport}</Badge>
                          {match.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {match.time}
                            </span>
                          )}
                          {match.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {match.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSelectMatch(match)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Select
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSchedule(match.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Today's Matches Warning */}
        {todaysMatches.length === 0 && schedules.length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  No matches scheduled for today. Upload more schedules or add matches manually.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Schedules (Recent) */}
        {schedules.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Schedules (Latest 10)</h3>
            <div className="space-y-2">
              {schedules.slice(0, 10).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {schedule.homeTeam} vs {schedule.awayTeam}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{schedule.league}</Badge>
                      <span>{new Date(schedule.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectMatch(schedule)}
                    >
                      Select
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {schedules.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No schedules uploaded yet.</p>
            <p className="text-sm">Upload an Excel file or add matches manually to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
