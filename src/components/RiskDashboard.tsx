'use client';

import {
  TrendingUp, TrendingDown, Target, AlertTriangle,
  Activity, DollarSign, BarChart2, Zap, Award, Shield
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { computeMetrics } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import MetricCard from './MetricCard';
import clsx from 'clsx';

export default function RiskDashboard() {
  const { trades, settings } = useTradeStore();
  const m = computeMetrics(trades, settings);

  const isDailyLimitWarning = m.dailyLossPercent >= 80;
  const isDailyLimitBreach = m.dailyLossPercent >= 100;
  const isDrawdownWarning = m.currentDrawdown >= settings.maxDrawdownPercent * 0.8;
  const isDrawdownBreach = m.currentDrawdown >= settings.maxDrawdownPercent;

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {(isDailyLimitBreach || isDrawdownBreach) && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Risk Limit Breached</p>
            <p className="text-xs text-red-300 mt-0.5">
              {isDailyLimitBreach && 'Daily loss limit exceeded. '}
              {isDrawdownBreach && 'Max drawdown limit exceeded. '}
              Consider stopping trading for today.
            </p>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {!isDailyLimitBreach && (isDailyLimitWarning || isDrawdownWarning) && (
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">Risk Warning</p>
            <p className="text-xs text-yellow-300 mt-0.5">
              {isDailyLimitWarning && `Daily loss at ${m.dailyLossPercent.toFixed(0)}% of limit. `}
              {isDrawdownWarning && `Drawdown approaching max limit. `}
              Trade carefully.
            </p>
          </div>
        </div>
      )}

      {/* Account Overview */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Account Overview</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Current Balance"
            value={formatCurrency(m.currentBalance, settings.currency)}
            subValue={`Starting: ${formatCurrency(settings.startingBalance, settings.currency)}`}
            icon={<DollarSign className="w-3.5 h-3.5" />}
            accent={m.totalPnL >= 0 ? 'green' : 'red'}
          />
          <MetricCard
            label="Total P&L"
            value={formatCurrency(m.totalPnL, settings.currency)}
            subValue={formatPercent((m.totalPnL / settings.startingBalance) * 100)}
            icon={m.totalPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            accent={m.totalPnL >= 0 ? 'green' : 'red'}
          />
          <MetricCard
            label="Today's P&L"
            value={formatCurrency(m.todayPnL, settings.currency)}
            subValue={m.todayPnL >= 0 ? 'Profitable day' : 'Losing day'}
            icon={<Activity className="w-3.5 h-3.5" />}
            accent={m.todayPnL >= 0 ? 'green' : 'red'}
          />
          <MetricCard
            label="Profit Target"
            value={formatCurrency(m.profitTarget, settings.currency)}
            subValue={`${m.profitTargetProgress.toFixed(1)}% achieved`}
            progress={m.profitTargetProgress}
            progressColor={m.profitTargetProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}
            icon={<Target className="w-3.5 h-3.5" />}
            accent={m.profitTargetProgress >= 100 ? 'green' : 'blue'}
          />
        </div>
      </div>

      {/* Risk Limits */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Risk Limits</h3>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Daily Loss Tracker */}
          <div className={clsx(
            'rounded-xl border p-4 bg-[#0d1117]',
            isDailyLimitBreach ? 'border-red-500/50' : isDailyLimitWarning ? 'border-yellow-500/30' : 'border-[#2a2f3e]'
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Daily Loss Limit</span>
              <Shield className={clsx(
                'w-4 h-4',
                isDailyLimitBreach ? 'text-red-400' : isDailyLimitWarning ? 'text-yellow-400' : 'text-blue-400'
              )} />
            </div>
            <div className={clsx(
              'text-2xl font-bold mb-1',
              isDailyLimitBreach ? 'text-red-400' : 'text-white'
            )}>
              {formatCurrency(m.dailyLossUsed, settings.currency)}
            </div>
            <p className="text-xs text-gray-500 mb-3">
              of {formatCurrency(m.dailyLossLimit, settings.currency)} limit ({settings.maxDailyRiskPercent}%)
            </p>
            <div className="w-full bg-[#1a1f2e] rounded-full h-2">
              <div
                className={clsx(
                  'h-2 rounded-full transition-all duration-500',
                  isDailyLimitBreach ? 'bg-red-500' : isDailyLimitWarning ? 'bg-yellow-500' : 'bg-blue-500'
                )}
                style={{ width: `${Math.min(100, m.dailyLossPercent)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">{m.dailyLossPercent.toFixed(1)}% used</span>
              <span className={clsx('text-xs font-medium', isDailyLimitBreach ? 'text-red-400' : 'text-green-400')}>
                {formatCurrency(m.dailyLossRemaining, settings.currency)} remaining
              </span>
            </div>
          </div>

          {/* Current Drawdown */}
          <div className={clsx(
            'rounded-xl border p-4 bg-[#0d1117]',
            isDrawdownBreach ? 'border-red-500/50' : isDrawdownWarning ? 'border-yellow-500/30' : 'border-[#2a2f3e]'
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current Drawdown</span>
              <TrendingDown className={clsx(
                'w-4 h-4',
                isDrawdownBreach ? 'text-red-400' : isDrawdownWarning ? 'text-yellow-400' : 'text-orange-400'
              )} />
            </div>
            <div className={clsx(
              'text-2xl font-bold mb-1',
              isDrawdownBreach ? 'text-red-400' : isDrawdownWarning ? 'text-yellow-400' : 'text-orange-400'
            )}>
              {m.currentDrawdown.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Max allowed: {settings.maxDrawdownPercent}%
            </p>
            <div className="w-full bg-[#1a1f2e] rounded-full h-2">
              <div
                className={clsx(
                  'h-2 rounded-full transition-all duration-500',
                  isDrawdownBreach ? 'bg-red-500' : isDrawdownWarning ? 'bg-yellow-500' : 'bg-orange-500'
                )}
                style={{ width: `${Math.min(100, (m.currentDrawdown / settings.maxDrawdownPercent) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Peak: {formatCurrency(m.peakBalance, settings.currency)}</span>
              <span className="text-xs text-gray-500">Max DD: {m.maxDrawdown.toFixed(2)}%</span>
            </div>
          </div>

          {/* Open Positions */}
          <div className="rounded-xl border border-[#2a2f3e] p-4 bg-[#0d1117]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Open Positions</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400 mb-1">{m.openPositions}</div>
            <p className="text-xs text-gray-500 mb-3">Active trades</p>
            <div className="space-y-2">
              {trades
                .filter((t) => t.status === 'open')
                .slice(0, 3)
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">{t.symbol}</span>
                    <span className={t.direction === 'long' ? 'text-green-400' : 'text-red-400'}>
                      {t.direction === 'long' ? '↑ LONG' : '↓ SHORT'}
                    </span>
                    <span className="text-gray-500">-{t.riskPercent.toFixed(1)}%</span>
                  </div>
                ))}
              {m.openPositions === 0 && (
                <p className="text-xs text-gray-600 italic">No open positions</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Performance Statistics</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Win Rate"
            value={`${m.winRate.toFixed(1)}%`}
            subValue={`${m.totalWins}W / ${m.totalLosses}L`}
            icon={<Award className="w-3.5 h-3.5" />}
            accent={m.winRate >= 50 ? 'green' : 'red'}
          />
          <MetricCard
            label="Profit Factor"
            value={isFinite(m.profitFactor) ? m.profitFactor.toFixed(2) : '∞'}
            subValue={m.profitFactor >= 1.5 ? 'Excellent' : m.profitFactor >= 1 ? 'Positive' : 'Negative'}
            icon={<BarChart2 className="w-3.5 h-3.5" />}
            accent={m.profitFactor >= 1.5 ? 'green' : m.profitFactor >= 1 ? 'yellow' : 'red'}
          />
          <MetricCard
            label="Avg Win"
            value={formatCurrency(m.averageWin, settings.currency)}
            subValue={`Largest: ${formatCurrency(m.largestWin, settings.currency)}`}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            accent="green"
          />
          <MetricCard
            label="Avg Loss"
            value={formatCurrency(m.averageLoss, settings.currency)}
            subValue={`Largest: ${formatCurrency(m.largestLoss, settings.currency)}`}
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            accent="red"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mt-3">
          <MetricCard
            label="Avg R Multiple"
            value={`${m.avgRMultiple >= 0 ? '+' : ''}${m.avgRMultiple.toFixed(2)}R`}
            subValue="Per closed trade"
            icon={<Target className="w-3.5 h-3.5" />}
            accent={m.avgRMultiple >= 1 ? 'green' : m.avgRMultiple >= 0 ? 'yellow' : 'red'}
          />
          <MetricCard
            label="Total Trades"
            value={m.totalTrades.toString()}
            subValue={`${m.openPositions} open`}
            icon={<Activity className="w-3.5 h-3.5" />}
            accent="blue"
          />
          <MetricCard
            label="Win Streak"
            value={m.consecutiveWins.toString()}
            subValue="Current consecutive wins"
            icon={<Zap className="w-3.5 h-3.5" />}
            accent={m.consecutiveWins >= 3 ? 'green' : 'yellow'}
          />
          <MetricCard
            label="Loss Streak"
            value={m.consecutiveLosses.toString()}
            subValue="Current consecutive losses"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            accent={m.consecutiveLosses >= 3 ? 'red' : 'orange'}
          />
        </div>
      </div>
    </div>
  );
}
