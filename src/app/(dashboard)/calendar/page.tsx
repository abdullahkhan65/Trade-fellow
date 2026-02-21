'use client';

import { useTradeStore } from '@/store/useTradeStore';
import { useAccountStore } from '@/store/useAccountStore';
import { accountToSettings } from '@/types';
import TradeCalendar from '@/components/TradeCalendar';
import { computeMetrics, formatCurrency } from '@/lib/calculations';
import clsx from 'clsx';

export default function CalendarPage() {
  const { trades } = useTradeStore();
  const { activeAccount } = useAccountStore();
  const settings = activeAccount ? accountToSettings(activeAccount) : { startingBalance: 100000, maxDailyRiskPercent: 5, maxDrawdownPercent: 10, profitTargetPercent: 10, tradingStyle: 'day' as const, currency: 'USD', trailingDrawdown: false, accountSize: 100000 };
  const metrics = computeMetrics(trades, settings);

  // Weekly stats
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekTrades = trades.filter((t) => {
    const d = new Date(t.date);
    return d >= weekStart && t.status === 'closed';
  });
  const weekPnL = weekTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white tracking-tight">Trade Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Daily P&L heatmap — spot patterns in your trading</p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "This Week's P&L", value: formatCurrency(weekPnL, settings.currency), color: weekPnL >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Total P&L', value: formatCurrency(metrics.totalPnL, settings.currency), color: metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%`, color: metrics.winRate >= 50 ? 'text-green-400' : 'text-red-400' },
          { label: 'Total Trades', value: metrics.totalTrades.toString(), color: 'text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={clsx('text-xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <TradeCalendar trades={trades} currency={settings.currency} />
    </div>
  );
}
