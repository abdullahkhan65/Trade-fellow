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
