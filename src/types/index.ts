export type TradingStyle = 'scalping' | 'swing' | 'day';
export type TradeStatus = 'open' | 'closed';
export type TradeDirection = 'long' | 'short';
export type AccountType = 'challenge' | 'funded' | 'personal';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  broker: string | null;
  account_number: string | null;
  account_type: AccountType;
  starting_balance: number;
  currency: string;
  max_daily_risk_percent: number;
  max_drawdown_percent: number;
  profit_target_percent: number;
  trading_style: TradingStyle;
  trailing_drawdown: boolean;
  metaapi_account_id: string | null;
  metaapi_token: string | null;
  is_active: boolean;
  created_at: string;
}

export function accountToSettings(account: Account): Settings {
  return {
    accountSize: account.starting_balance,
    startingBalance: account.starting_balance,
    maxDailyRiskPercent: account.max_daily_risk_percent,
    maxDrawdownPercent: account.max_drawdown_percent,
    profitTargetPercent: account.profit_target_percent,
    tradingStyle: account.trading_style,
    currency: account.currency,
    trailingDrawdown: account.trailing_drawdown,
  };
}

export interface Trade {
  id: string;
  account_id?: string;
  user_id?: string;
  date: string;
  symbol: string;
  direction: TradeDirection;
  positionSize: number;
  entry: number;
  stopLoss: number;
  takeProfit: number | null;
  exit: number | null;
  pnl: number | null;
  riskAmount: number;
  riskPercent: number;
  rMultiple: number | null;
  status: TradeStatus;
  tradingStyle: TradingStyle;
  notes: string;
  tags: string[];
  mt5_ticket?: string | null;
}

export interface Settings {
  accountSize: number;
  maxDailyRiskPercent: number;
  maxDrawdownPercent: number;
  profitTargetPercent: number;
  tradingStyle: TradingStyle;
  currency: string;
  trailingDrawdown: boolean;
  startingBalance: number;
}

export interface DashboardMetrics {
  totalPnL: number;
  todayPnL: number;
  currentBalance: number;
  dailyLossUsed: number;
  dailyLossLimit: number;
  dailyLossRemaining: number;
  dailyLossPercent: number;
  currentDrawdown: number;
  maxDrawdown: number;
  peakBalance: number;
  winRate: number;
  totalTrades: number;
  openPositions: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  totalWins: number;
  totalLosses: number;
  profitTarget: number;
  profitTargetProgress: number;
  avgRMultiple: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface EquityPoint {
  date: string;
  balance: number;
  pnl: number;
  drawdown: number;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export type GoalType = 'challenge' | 'monthly_profit' | 'consistency' | 'discipline' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export interface Goal {
  id: string;
  user_id: string;
  account_id: string | null;
  type: GoalType;
  title: string;
  description: string | null;
  target_value: number | null;
  target_unit: string | null;
  start_date: string;
  deadline: string | null;
  config: Record<string, unknown>;
  status: GoalStatus;
  completed_at: string | null;
  created_at: string;
}

// Per-type config shapes stored in goal.config
export interface ChallengeConfig {
  propFirm: string;
  propFirmName: string;
  phase: 'phase1' | 'phase2' | 'funded';
  accountSize: number;
  profitTargetPercent: number;
  profitTargetAmount: number;
  maxDailyLossPercent: number;
  maxDrawdownPercent: number;
  deadline: string;
  tradingDaysPerWeek: number;
  maxRiskPerTrade: number;
  tradingDaysRemaining: number;
  dailyProfitNeeded: number;
}

export interface MonthlyProfitConfig {
  targetType: 'amount' | 'percent';
  targetAmount: number;
  targetPercent: number;
  deadline: string;
  startingBalance: number;
}

export interface ConsistencyConfig {
  targetDays: number;
  greenDayDefinition: 'any_profit' | 'min_amount' | 'min_percent';
  greenDayMinAmount?: number;
  greenDayMinPercent?: number;
}

export interface DisciplineConfig {
  mainIssue: 'overtrading' | 'revenge_trading' | 'fomo' | 'poor_exits' | 'not_following_plan';
  maxDailyTrades: number;
  tradingRules: string[];
  successTargetDays: number;
}

export interface CustomConfig {
  measureType: 'amount' | 'percent' | 'days' | 'trades' | 'r_multiples';
  targetValue: number;
  notes: string;
}

// ─── Daily Journal ────────────────────────────────────────────────────────────

export interface DailyJournal {
  id: string;
  user_id: string;
  account_id: string;
  date: string;
  market_bias: 'bullish' | 'bearish' | 'neutral' | 'mixed' | null;
  planned_pairs: string[];
  pre_market_notes: string | null;
  mood_before: number | null;
  rules_reviewed: boolean;
  post_market_notes: string | null;
  mood_after: number | null;
  lessons_learned: string | null;
  followed_rules: boolean | null;
  created_at: string;
  updated_at: string;
}
