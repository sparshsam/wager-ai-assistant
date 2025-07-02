
export interface Match {
  id: string;
  date: string;
  league: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
  homeXG?: number;
  awayXG?: number;
  homeForm?: string;
  awayForm?: string;
  homeInjuries?: string;
  awayInjuries?: string;
  trends?: string;
  selected: boolean;
  fixtureData?: any;
  statsData?: any;
  scriptData?: any;
}

export interface Pick {
  id: string;
  userId: string;
  matchId?: string;
  entryId: string;
  date: Date;
  sport: string;
  league: string;
  event: string;
  betType: string;
  selection: string;
  line?: string;
  oddsAmerican: string;
  oddsDecimal?: number;
  stake: number;
  potentialWin?: number;
  result: 'Pending' | 'Win' | 'Loss' | 'Push' | 'Void';
  actualResult?: string;
  profitLoss?: number;
  runningBankroll?: number;
  bankrollChange?: number;
  roi?: number;
  cisGenerated?: string;
  scriptSummary?: string;
  justification?: string;
  confidence?: number;
  tags?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankrollHistory {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  change?: number;
  changeType: 'Deposit' | 'Withdrawal' | 'Bet_Win' | 'Bet_Loss' | 'Adjustment';
  description?: string;
  relatedPickId?: string;
  createdAt: Date;
}

export interface UploadedData {
  id: string;
  userId: string;
  fileName: string;
  sport: string;
  league: string;
  uploadDate: Date;
  bettingScript?: any;
  fixtures?: any;
  stats?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// New interfaces for v2 enhancements
export interface LeagueSchedule {
  id: string;
  userId: string;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  time?: string;
  venue?: string;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Postponed';
  homeScore?: number;
  awayScore?: number;
  season?: string;
  round?: string;
  matchweek?: number;
  competition?: string;
  isSelected: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BettingScript {
  id: string;
  userId: string;
  league: string;
  sport: string;
  fileName: string;
  content: string;
  description?: string;
  version: string;
  isActive: boolean;
  rules?: string;
  guidelines?: string;
  stakeLogic?: string;
  riskManagement?: string;
  lastUsed?: Date;
  timesUsed: number;
  successRate?: number;
  avgROI?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchupStats {
  id: string;
  userId: string;
  matchId?: string;
  league: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  statsContent: string;
  statsType: 'Manual' | 'Imported' | 'API';
  source?: string;
  isProcessed: boolean;
  processingNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExcelSheetData {
  bettingScript: any[];
  fixtures: any[];
  stats: any[];
}

export interface BettingScriptRule {
  rule: string;
  value: string | number;
  description?: string;
}

export interface FilterOptions {
  sport?: string;
  league?: string;
  betType?: string;
  result?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const SUPPORTED_SPORTS = [
  'NBA',
  'WNBA', 
  'MLS',
  'UFC',
  'NHL',
  'NFL',
  'MLB',
  'Premier League',
  'Champions League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Tennis'
] as const;

export const BET_TYPES = [
  'Moneyline',
  'Point Spread',
  'Total Points',
  'Player Props',
  'Team Props',
  'First Half',
  'Live Betting',
  'Futures'
] as const;

export type SupportedSport = typeof SUPPORTED_SPORTS[number];
export type BetType = typeof BET_TYPES[number];

// V2 Enhancement Types
export interface ScheduleUploadData {
  Date: string;
  Home: string;
  Away: string;
  League: string;
  Time?: string;
  Venue?: string;
  Sport?: string;
}

export interface ScriptUploadResult {
  success: boolean;
  fileName: string;
  league: string;
  content: string;
  error?: string;
}

export interface ScheduleUploadResult {
  success: boolean;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  todaysMatches: number;
  errors?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  injuryDetected?: boolean;
  scheduleAvailable?: boolean;
  scriptAvailable?: boolean;
}

export interface InjuryValidation {
  detected: boolean;
  keywords: string[];
  confidence: number;
  suggestions: string[];
}

export interface MatchSelectionData {
  schedule?: LeagueSchedule;
  statsInput?: string;
  previewText?: string;
  oddsData?: string;
  availableScript?: BettingScript;
}

export interface DashboardTab {
  id: string;
  label: string;
  icon: any;
  component: React.ComponentType<any>;
  badge?: number;
}

// Enhanced filter options for v2
export interface EnhancedFilterOptions extends FilterOptions {
  status?: 'Scheduled' | 'InProgress' | 'Completed' | 'Postponed';
  hasScript?: boolean;
  hasSchedule?: boolean;
  injuryMentioned?: boolean;
}

// Script execution context
export interface ScriptExecutionContext {
  selectedMatch: LeagueSchedule;
  statsInput: string;
  previewText: string;
  oddsData: string;
  script: BettingScript;
  cisAnalysis?: string;
  injuryValidation: InjuryValidation;
}

// Enhanced CIS generation context
export interface CISGenerationContext {
  selectedMatches: LeagueSchedule[];
  statsInput: string;
  previewText: string;
  oddsData: string;
  injuryContext?: string;
  historicalData?: any;
}

// Constants for validation
export const INJURY_KEYWORDS = [
  'injury', 'injured', 'doubt', 'doubtful', 'out', 'ruled out',
  'questionable', 'probable', 'day-to-day', 'sidelined', 'unavailable',
  'fitness', 'knock', 'strain', 'sprain', 'tear', 'surgery',
  'rehabilitation', 'recovery', 'medical', 'treatment'
] as const;

export const DASHBOARD_TABS = [
  'match-selection',
  'preview-odds',
  'cis-generator', 
  'betting-script',
  'pick-logger',
  'manage-schedules',
  'manage-scripts'
] as const;

export type DashboardTabId = typeof DASHBOARD_TABS[number];
