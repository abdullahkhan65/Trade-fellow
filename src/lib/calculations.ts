import { Trade, DashboardMetrics, EquityPoint, Settings } from '@/types';
import { format, isToday, parseISO } from 'date-fns';

export function calculateRisk(
  entry: number,
  stopLoss: number,
  positionSize: number,
  accountSize: number,
  direction: 'long' | 'short'
): { riskAmount: number; riskPercent: number } {
  const priceDiff = direction === 'long' ? entry - stopLoss : stopLoss - entry;
  const riskAmount = Math.abs(priceDiff * positionSize);
  const riskPercent = (riskAmount / accountSize) * 100;
  return { riskAmount, riskPercent };
}

export function calculatePnL(
  entry: number,
  exit: number,
  positionSize: number,
  direction: 'long' | 'short'
): number {
  if (direction === 'long') {
    return (exit - entry) * positionSize;
  } else {
    return (entry - exit) * positionSize;
  }
}

export function calculateRMultiple(
  entry: number,
  exit: number,
  stopLoss: number,
  direction: 'long' | 'short'
): number {
  const risk = Math.abs(entry - stopLoss);
  if (risk === 0) return 0;
  const reward = direction === 'long' ? exit - entry : entry - exit;
  return reward / risk;
}

export function computeMetrics(
  trades: Trade[],
  settings: Settings
): DashboardMetrics {
  const closedTrades = trades.filter((t) => t.status === 'closed' && t.pnl !== null);
  const openTrades = trades.filter((t) => t.status === 'open');
  const todayTrades = closedTrades.filter((t) => {
    try {
      return isToday(parseISO(t.date));
    } catch {
      return false;
    }
  });

  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const currentBalance = settings.startingBalance + totalPnL;

  const todayLosses = todayTrades.filter((t) => (t.pnl ?? 0) < 0);
  const dailyLossUsed = Math.abs(todayLosses.reduce((sum, t) => sum + (t.pnl ?? 0), 0));
  const dailyLossLimit = (settings.maxDailyRiskPercent / 100) * settings.startingBalance;
  const dailyLossRemaining = Math.max(0, dailyLossLimit - dailyLossUsed);
  const dailyLossPercent = dailyLossLimit > 0 ? (dailyLossUsed / dailyLossLimit) * 100 : 0;

  // Compute equity curve to find peak and max drawdown
  let peak = settings.startingBalance;
  let maxDrawdown = 0;
  let runningBalance = settings.startingBalance;

  const sortedClosed = [...closedTrades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const trade of sortedClosed) {
    runningBalance += trade.pnl ?? 0;
    if (runningBalance > peak) peak = runningBalance;
    const dd = ((peak - runningBalance) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const peakBalance = peak;
  const currentDrawdown = peakBalance > 0 ? ((peakBalance - currentBalance) / peakBalance) * 100 : 0;

  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

  const grossWin = wins.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl ?? 0), 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;

  const averageWin = wins.length > 0 ? grossWin / wins.length : 0;
  const averageLoss = losses.length > 0 ? grossLoss / losses.length : 0;

  const profitTarget = (settings.profitTargetPercent / 100) * settings.startingBalance;
  const profitTargetProgress = profitTarget > 0 ? Math.min(100, (totalPnL / profitTarget) * 100) : 0;

  const rMultiples = closedTrades.map((t) => t.rMultiple ?? 0).filter((r) => r !== 0);
  const avgRMultiple = rMultiples.length > 0 ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length : 0;

  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl ?? 0)) : 0;
  const largestLoss = losses.length > 0 ? Math.max(...losses.map((t) => Math.abs(t.pnl ?? 0))) : 0;

  // Consecutive wins/losses (current streak)
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  for (let i = sortedClosed.length - 1; i >= 0; i--) {
    const pnl = sortedClosed[i].pnl ?? 0;
    if (i === sortedClosed.length - 1) {
      if (pnl > 0) consecutiveWins = 1;
      else if (pnl < 0) consecutiveLosses = 1;
      else break;
    } else {
      if (consecutiveWins > 0 && pnl > 0) consecutiveWins++;
      else if (consecutiveLosses > 0 && pnl < 0) consecutiveLosses++;
      else break;
    }
  }

  return {
    totalPnL,
    todayPnL,
    currentBalance,
    dailyLossUsed,
    dailyLossLimit,
    dailyLossRemaining,
    dailyLossPercent,
    currentDrawdown: Math.max(0, currentDrawdown),
    maxDrawdown,
    peakBalance,
    winRate,
    totalTrades: closedTrades.length,
    openPositions: openTrades.length,
    profitFactor,
    averageWin,
    averageLoss,
    totalWins: wins.length,
    totalLosses: losses.length,
    profitTarget,
    profitTargetProgress,
    avgRMultiple,
    largestWin,
    largestLoss,
    consecutiveWins,
    consecutiveLosses,
  };
}

export function buildEquityCurve(trades: Trade[], startingBalance: number): EquityPoint[] {
  const closedTrades = trades
    .filter((t) => t.status === 'closed' && t.pnl !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const points: EquityPoint[] = [
    { date: 'Start', balance: startingBalance, pnl: 0, drawdown: 0 },
  ];

  let balance = startingBalance;
  let peak = startingBalance;

  for (const trade of closedTrades) {
    balance += trade.pnl ?? 0;
    if (balance > peak) peak = balance;
    const drawdown = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
    points.push({
      date: format(parseISO(trade.date), 'MMM dd'),
      balance: parseFloat(balance.toFixed(2)),
      pnl: parseFloat((trade.pnl ?? 0).toFixed(2)),
      drawdown: parseFloat(drawdown.toFixed(2)),
    });
  }

  return points;
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}
