
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  Eye, 
  Edit,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Download,
  Settings
} from 'lucide-react';
import { BettingScript, ScriptUploadResult, SUPPORTED_SPORTS } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface LeagueScriptsPanelProps {
  onScriptSelected?: (script: BettingScript) => void;
}

export default function LeagueScriptsPanel({ onScriptSelected }: LeagueScriptsPanelProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [scripts, setScripts] = useState<BettingScript[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedScript, setSelectedScript] = useState<BettingScript | null>(null);
  const [editingScript, setEditingScript] = useState<BettingScript | null>(null);
  
  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    league: '',
    sport: '',
    content: '',
    description: '',
    fileName: ''
  });

  // Stats
  const [stats, setStats] = useState({
    totalScripts: 0,
    activeScripts: 0,
    leaguesCovered: 0,
    avgSuccessRate: 0
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetchScripts();
    }
  }, [session]);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scripts');
      if (response.ok) {
        const data = await response.json();
        setScripts(data.scripts || []);
        setStats(data.stats || { totalScripts: 0, activeScripts: 0, leaguesCovered: 0, avgSuccessRate: 0 });
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch betting scripts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a text file (.txt)',
        variant: 'destructive',
      });
      return;
    }

    // Extract league from filename (e.g., "WNBA.txt" -> "WNBA")
    const league = file.name.replace('.txt', '').toUpperCase();

    setUploading(true);
    try {
      const content = await file.text();
      
      if (!content.trim()) {
        toast({
          title: 'Empty File',
          description: 'The uploaded file is empty',
          variant: 'destructive',
        });
        return;
      }

      // Upload to backend
      const response = await fetch('/api/scripts/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          league,
          content: content.trim(),
          sport: 'Unknown' // Will be determined by league name matching
        }),
      });

      if (response.ok) {
        const result: ScriptUploadResult = await response.json();
        toast({
          title: 'Upload Successful',
          description: `${result.league} betting script uploaded successfully`,
        });
        fetchScripts();
      } else {
        const error = await response.json();
        toast({
          title: 'Upload Failed',
          description: error.message || 'Failed to upload script',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to read the text file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.league || !manualForm.content) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in league and script content',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...manualForm,
          fileName: manualForm.fileName || `${manualForm.league}.txt`,
          sport: manualForm.sport || 'Unknown'
        }),
      });

      if (response.ok) {
        toast({
          title: 'Script Added',
          description: 'Betting script has been added successfully',
        });
        setManualForm({
          league: '',
          sport: '',
          content: '',
          description: '',
          fileName: ''
        });
        setShowManualEntry(false);
        fetchScripts();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to add script',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding script:', error);
      toast({
        title: 'Error',
        description: 'Failed to add script',
        variant: 'destructive',
      });
    }
  };

  const handleSelectScript = (script: BettingScript) => {
    onScriptSelected?.(script);
    toast({
      title: 'Script Selected',
      description: `Selected ${script.league} betting script`,
    });
  };

  const deleteScript = async (id: string) => {
    try {
      const response = await fetch(`/api/scripts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Script Deleted',
          description: 'Betting script has been removed',
        });
        fetchScripts();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete script',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting script:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete script',
        variant: 'destructive',
      });
    }
  };

  const updateScript = async (script: BettingScript) => {
    try {
      const response = await fetch(`/api/scripts/${script.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(script),
      });

      if (response.ok) {
        toast({
          title: 'Script Updated',
          description: 'Betting script has been updated',
        });
        setEditingScript(null);
        fetchScripts();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update script',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating script:', error);
      toast({
        title: 'Error',
        description: 'Failed to update script',
        variant: 'destructive',
      });
    }
  };

  const downloadTemplate = () => {
    const templateContent = `BETTING SCRIPT TEMPLATE FOR [LEAGUE]

1. STAKE LOGIC:
   - Base unit: $10
   - High confidence (8-10): 3 units
   - Medium confidence (5-7): 2 units
   - Low confidence (1-4): 1 unit

2. BET TYPES TO FOCUS ON:
   - Moneyline (ML): Primary focus
   - Point spread: Secondary
   - Totals: Tertiary

3. RISK MANAGEMENT:
   - Max 5% of bankroll per bet
   - No more than 3 bets per day
   - Avoid heavy favorites (-300 or more)

4. KEY FACTORS TO CONSIDER:
   - Team form and momentum
   - Head-to-head record
   - Injury reports
   - Home/away performance
   - Rest and travel factors

5. SPECIFIC GUIDELINES:
   - [Add league-specific rules here]
   - [Include any statistical thresholds]
   - [Note any situational factors]

6. EXECUTION NOTES:
   - Always wait for confirmed lineups
   - Monitor line movement
   - Consider live betting opportunities
`;

    const blob = new Blob([templateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'betting_script_template.txt';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Betting script template has been downloaded',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              League Betting Scripts
            </CardTitle>
            <CardDescription>
              Upload .txt files or create scripts manually. Auto-loads when match selected.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" size="sm" onClick={fetchScripts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.totalScripts}</div>
            <div className="text-sm text-muted-foreground">Total Scripts</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.activeScripts}</div>
            <div className="text-sm text-muted-foreground">Active Scripts</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.leaguesCovered}</div>
            <div className="text-sm text-muted-foreground">Leagues Covered</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.avgSuccessRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Avg Success Rate</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="script-upload" className="text-sm font-medium">
                Upload Betting Script (.txt)
              </Label>
              <div className="mt-2">
                <Input
                  id="script-upload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Name your file with the league (e.g., "WNBA.txt", "Premier League.txt")
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
                Create Script
              </Button>
            </div>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing script file...</span>
            </div>
          )}
        </div>

        {/* Manual Entry Form */}
        {showManualEntry && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Create Betting Script</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="league">League *</Label>
                    <Input
                      id="league"
                      value={manualForm.league}
                      onChange={(e) => setManualForm({...manualForm, league: e.target.value})}
                      placeholder="e.g., WNBA, Premier League"
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
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={manualForm.description}
                    onChange={(e) => setManualForm({...manualForm, description: e.target.value})}
                    placeholder="Brief description of the script"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Script Content *</Label>
                  <Textarea
                    id="content"
                    value={manualForm.content}
                    onChange={(e) => setManualForm({...manualForm, content: e.target.value})}
                    placeholder="Enter your betting script rules, stake logic, and guidelines..."
                    className="min-h-[200px]"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Script
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowManualEntry(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Active Scripts */}
        {scripts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Available Scripts ({scripts.length})
            </h3>
            <div className="grid gap-3">
              {scripts.map((script) => (
                <Card key={script.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{script.league}</div>
                          <Badge variant="secondary">{script.sport}</Badge>
                          {script.isActive && <Badge variant="default" className="bg-green-600">Active</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {script.description || 'No description provided'}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>v{script.version}</span>
                          <span>Used {script.timesUsed} times</span>
                          {script.successRate && (
                            <span className="text-green-600">
                              {script.successRate.toFixed(1)}% success rate
                            </span>
                          )}
                          <span>Updated {new Date(script.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedScript(script)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{script.league} Betting Script</DialogTitle>
                              <DialogDescription>{script.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Script Content</Label>
                                <Textarea
                                  value={script.content}
                                  readOnly
                                  className="min-h-[300px] mt-2"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleSelectScript(script)}>
                                  Use This Script
                                </Button>
                                <Button variant="outline" onClick={() => setEditingScript(script)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          onClick={() => handleSelectScript(script)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Use
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteScript(script.id)}
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

        {/* Empty State */}
        {scripts.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No betting scripts uploaded yet.</p>
            <p className="text-sm">Upload .txt files or create scripts manually to get started.</p>
          </div>
        )}

        {/* Edit Script Dialog */}
        {editingScript && (
          <Dialog open={!!editingScript} onOpenChange={() => setEditingScript(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Betting Script</DialogTitle>
                <DialogDescription>Modify the script content and settings</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>League</Label>
                    <Input
                      value={editingScript.league}
                      onChange={(e) => setEditingScript({...editingScript, league: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Sport</Label>
                    <Select
                      value={editingScript.sport}
                      onValueChange={(value) => setEditingScript({...editingScript, sport: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingScript.description || ''}
                    onChange={(e) => setEditingScript({...editingScript, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Script Content</Label>
                  <Textarea
                    value={editingScript.content}
                    onChange={(e) => setEditingScript({...editingScript, content: e.target.value})}
                    className="min-h-[300px] mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => updateScript(editingScript)}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingScript(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
