'use client';

import { EquityCurveChart, DrawdownChart, PLHistogram, MonthlyPerformanceChart, RMultipleChart } from '@/components/Charts';
import { useTradeStore } from '@/store/useTradeStore';
import { computeMetrics, formatCurrency } from '@/lib/calculations';
import clsx from 'clsx';

export default function ChartsPage() {
  const { trades, settings } = useTradeStore();
  const m = computeMetrics(trades, settings);
  const closedCount = trades.filter((t) => t.status === 'closed').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Visual performance analysis across all trades</p>
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total P&L', value: formatCurrency(m.totalPnL, settings.currency), color: m.totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Win Rate', value: `${m.winRate.toFixed(1)}%`, color: m.winRate >= 50 ? 'text-green-400' : 'text-red-400' },
          { label: 'Profit Factor', value: isFinite(m.profitFactor) ? m.profitFactor.toFixed(2) : '∞', color: m.profitFactor >= 1 ? 'text-blue-400' : 'text-red-400' },
          { label: 'Max Drawdown', value: `${m.maxDrawdown.toFixed(2)}%`, color: m.maxDrawdown > settings.maxDrawdownPercent * 0.8 ? 'text-orange-400' : 'text-gray-300' },
          { label: 'Avg R Multiple', value: `${m.avgRMultiple >= 0 ? '+' : ''}${m.avgRMultiple.toFixed(2)}R`, color: m.avgRMultiple >= 1 ? 'text-green-400' : 'text-yellow-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={clsx('text-xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {closedCount === 0 ? (
        <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-16 text-center">
          <p className="text-gray-500 text-sm">No closed trades yet. Log some trades to see analytics.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Row 1: Equity + Drawdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <EquityCurveChart />
            <DrawdownChart />
          </div>

          {/* Row 2: P&L + Monthly */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PLHistogram />
            <MonthlyPerformanceChart />
          </div>

          {/* Row 3: R Multiple */}
          <RMultipleChart />
        </div>
      )}
    </div>
  );
}
