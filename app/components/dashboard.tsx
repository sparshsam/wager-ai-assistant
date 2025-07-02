
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  LogOut, 
  User,
  Upload,
  FileText,
  Brain,
  Target,
  Archive,
  Calendar,
  Settings,
  Search,
  BarChart3
} from 'lucide-react';
import MatchUploadPanel from '@/components/match-upload-panel';
import PreviewOddsPanel from '@/components/preview-odds-panel';
import CISGeneratorPanel from '@/components/cis-generator-panel';
import BettingScriptPanel from '@/components/betting-script-panel';
import PickLoggerPanel from '@/components/pick-logger-panel';
import LeagueSchedulesPanel from '@/components/league-schedules-panel';
import LeagueScriptsPanel from '@/components/league-scripts-panel';
import { LeagueSchedule, BettingScript, DashboardTabId } from '@/lib/types';

export default function Dashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  // V2 Enhanced State Management
  const [activeTab, setActiveTab] = useState<DashboardTabId>('match-selection');
  const [selectedSchedule, setSelectedSchedule] = useState<LeagueSchedule | null>(null);
  const [selectedScript, setSelectedScript] = useState<BettingScript | null>(null);
  const [statsInput, setStatsInput] = useState('');
  const [previewData, setPreviewData] = useState({ preview: '', odds: '' });
  const [cisResult, setCisResult] = useState('');
  const [refreshPicks, setRefreshPicks] = useState(0);
  const [injuryValidation, setInjuryValidation] = useState({
    detected: false,
    keywords: [] as string[],
    confidence: 0,
    suggestions: [] as string[]
  });

  // Legacy state for backward compatibility
  const [selectedMatches, setSelectedMatches] = useState<any[]>([]);

  // Tab configuration
  const tabs = [
    {
      id: 'match-selection' as DashboardTabId,
      label: 'Match Selection',
      icon: Search,
      badge: selectedSchedule ? 1 : undefined
    },
    {
      id: 'preview-odds' as DashboardTabId,
      label: 'Preview & Odds',
      icon: BarChart3,
      badge: previewData.preview && previewData.odds ? 1 : undefined
    },
    {
      id: 'cis-generator' as DashboardTabId,
      label: 'CIS Generator',
      icon: Brain,
      badge: cisResult ? 1 : undefined
    },
    {
      id: 'betting-script' as DashboardTabId,
      label: 'Betting Script',
      icon: Target,
      badge: selectedScript ? 1 : undefined
    },
    {
      id: 'pick-logger' as DashboardTabId,
      label: 'Pick Logger',
      icon: Archive,
      badge: undefined
    },
    {
      id: 'manage-schedules' as DashboardTabId,
      label: 'Manage Schedules',
      icon: Calendar,
      badge: undefined
    },
    {
      id: 'manage-scripts' as DashboardTabId,
      label: 'Manage Scripts',
      icon: Settings,
      badge: undefined
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  // V2 Enhanced Handlers
  const handleScheduleSelected = (schedule: LeagueSchedule) => {
    setSelectedSchedule(schedule);
    // Convert to legacy format for backward compatibility
    setSelectedMatches([{
      id: schedule.id,
      date: schedule.date,
      league: schedule.league,
      sport: schedule.sport,
      homeTeam: schedule.homeTeam,
      awayTeam: schedule.awayTeam,
      venue: schedule.venue,
      selected: true
    }]);
    setActiveTab('preview-odds');
    toast({
      title: 'Match Selected',
      description: `${schedule.homeTeam} vs ${schedule.awayTeam} selected`,
    });
  };

  const handleScriptSelected = (script: BettingScript) => {
    setSelectedScript(script);
    toast({
      title: 'Script Selected',
      description: `${script.league} betting script loaded`,
    });
  };

  const handleStatsInput = (stats: string) => {
    setStatsInput(stats);
  };

  const handlePreviewDataSaved = (data: { preview: string; odds: string }) => {
    setPreviewData(data);
    // Perform injury validation
    validateInjuryMention(data.preview);
  };

  const validateInjuryMention = (text: string) => {
    const injuryKeywords = [
      'injury', 'injured', 'doubt', 'doubtful', 'out', 'ruled out',
      'questionable', 'probable', 'day-to-day', 'sidelined', 'unavailable',
      'fitness', 'knock', 'strain', 'sprain', 'tear', 'surgery',
      'rehabilitation', 'recovery', 'medical', 'treatment'
    ];

    const lowerText = text.toLowerCase();
    const foundKeywords = injuryKeywords.filter(keyword => lowerText.includes(keyword));
    const detected = foundKeywords.length > 0;
    const confidence = Math.min(foundKeywords.length * 20, 100);

    setInjuryValidation({
      detected,
      keywords: foundKeywords,
      confidence,
      suggestions: detected ? [] : [
        'Consider mentioning injury status of key players',
        'Check team news for last-minute changes',
        'Verify lineup confirmations before betting'
      ]
    });

    if (!detected) {
      toast({
        title: 'Injury Validation Warning',
        description: '⚠️ No injury data detected in preview. Consider adding injury context.',
        variant: 'destructive',
      });
    }
  };

  const handleCISGenerated = (cis: string) => {
    setCisResult(cis);
  };

  const handlePickLogged = () => {
    setRefreshPicks(prev => prev + 1);
    toast({
      title: 'Pick Logged',
      description: 'Your bet has been successfully logged',
    });
  };

  // Legacy handlers for backward compatibility
  const handleMatchesSelected = (matches: any[]) => {
    setSelectedMatches(matches);
  };

  // Render component based on active tab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'match-selection':
        return <LeagueSchedulesPanel onScheduleSelected={handleScheduleSelected} />;
      
      case 'preview-odds':
        return (
          <PreviewOddsPanel 
            onDataSaved={handlePreviewDataSaved}
            selectedMatchesCount={selectedSchedule ? 1 : selectedMatches.length}
            onStatsInput={handleStatsInput}
            selectedSchedule={selectedSchedule}
            injuryValidation={injuryValidation}
          />
        );
      
      case 'cis-generator':
        return (
          <CISGeneratorPanel
            selectedMatches={selectedMatches}
            selectedSchedule={selectedSchedule}
            previewData={previewData}
            statsInput={statsInput}
            onCISGenerated={handleCISGenerated}
            injuryValidation={injuryValidation}
          />
        );
      
      case 'betting-script':
        return (
          <BettingScriptPanel
            selectedMatches={selectedMatches}
            selectedSchedule={selectedSchedule}
            selectedScript={selectedScript}
            previewData={previewData}
            statsInput={statsInput}
            cisResult={cisResult}
            injuryValidation={injuryValidation}
            onPickLogged={handlePickLogged}
          />
        );
      
      case 'pick-logger':
        return <PickLoggerPanel refreshTrigger={refreshPicks} />;
      
      case 'manage-schedules':
        return <LeagueSchedulesPanel onScheduleSelected={handleScheduleSelected} />;
      
      case 'manage-scripts':
        return <LeagueScriptsPanel onScriptSelected={handleScriptSelected} />;
      
      default:
        return <LeagueSchedulesPanel onScheduleSelected={handleScheduleSelected} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">The Wager AI</h1>
            <Badge variant="outline" className="ml-2">v2.0</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {session?.user?.email}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap ${
                    isActive ? 'border-b-2 border-primary' : ''
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.badge && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {tab.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Context Bar */}
        {(selectedSchedule || selectedScript || injuryValidation.detected) && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Context</h3>
              <div className="flex gap-2">
                {selectedSchedule && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab('preview-odds')}
                  >
                    Continue Analysis
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {selectedSchedule && (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Match:</span>
                  <span>{selectedSchedule.homeTeam} vs {selectedSchedule.awayTeam}</span>
                  <Badge variant="secondary">{selectedSchedule.league}</Badge>
                </div>
              )}
              {selectedScript && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Script:</span>
                  <span>{selectedScript.league} v{selectedScript.version}</span>
                </div>
              )}
              {injuryValidation.detected && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Injury Data:</span>
                  <span>{injuryValidation.keywords.length} keyword(s) detected</span>
                  <Badge variant="default" className="bg-green-600">✓</Badge>
                </div>
              )}
              {!injuryValidation.detected && previewData.preview && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Injury Data:</span>
                  <span>Not detected</span>
                  <Badge variant="destructive">⚠️</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Component */}
        <div className="space-y-6">
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
}
