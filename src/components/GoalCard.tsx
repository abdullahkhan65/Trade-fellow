'use client';

import { Trophy, TrendingUp, Flame, Shield, Star, MoreHorizontal, Check, Trash2, Flag } from 'lucide-react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTradeStore } from '@/store/useTradeStore';
import { format, differenceInCalendarDays } from 'date-fns';
import type { Goal, ChallengeConfig, MonthlyProfitConfig, ConsistencyConfig, DisciplineConfig } from '@/types';
import { useState } from 'react';
import clsx from 'clsx';

const TYPE_META = {
  challenge:       { icon: Trophy,     color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', bar: 'bg-yellow-400' },
  monthly_profit:  { icon: TrendingUp, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  bar: 'bg-green-400'  },
  consistency:     { icon: Flame,      color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', bar: 'bg-orange-400' },
  discipline:      { icon: Shield,     color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   bar: 'bg-blue-400'   },
  custom:          { icon: Star,       color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', bar: 'bg-purple-400' },
};

function computeGreenStreak(trades: import('@/types').Trade[], threshold = 0): number {
  const closed = trades.filter((t) => t.status === 'closed' && t.pnl != null);
  const byDate = new Map<string, number>();
  for (const t of closed) {
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + (t.pnl ?? 0));
  }
  const dates = [...byDate.keys()].sort().reverse();
  let streak = 0;
  for (const date of dates) {
    if ((byDate.get(date) ?? 0) > threshold) streak++;
    else break;
  }
  return streak;
}

function computeProgress(goal: Goal, trades: import('@/types').Trade[]): {
  progressPct: number;
  primaryLabel: string;
  secondaryLabel: string;
  status: 'ahead' | 'on-track' | 'behind' | 'complete';
} {
  const today = format(new Date(), 'yyyy-MM-dd');
  const thisMonth = today.slice(0, 7);

  if (goal.type === 'challenge') {
    const cfg = goal.config as unknown as ChallengeConfig;
    const totalPnL = trades.filter((t) => t.status === 'closed' && t.date >= goal.start_date).reduce((s, t) => s + (t.pnl ?? 0), 0);
    const pct = cfg.profitTargetAmount > 0 ? Math.min((totalPnL / cfg.profitTargetAmount) * 100, 100) : 0;
    const daysLeft = goal.deadline ? Math.max(0, differenceInCalendarDays(new Date(goal.deadline + 'T00:00:00'), new Date())) : null;
    const status = pct >= 100 ? 'complete' : totalPnL >= 0 ? 'on-track' : 'behind';
    return {
      progressPct: Math.max(0, pct),
      primaryLabel: `$${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })} / $${cfg.profitTargetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      secondaryLabel: daysLeft !== null ? `${daysLeft} days left` : `${pct.toFixed(1)}% complete`,
      status,
    };
  }

  if (goal.type === 'monthly_profit') {
    const cfg = goal.config as unknown as MonthlyProfitConfig;
    const monthPnL = trades.filter((t) => t.status === 'closed' && t.date.startsWith(thisMonth)).reduce((s, t) => s + (t.pnl ?? 0), 0);
    const pct = cfg.targetAmount > 0 ? Math.min((monthPnL / cfg.targetAmount) * 100, 100) : 0;
    const status = pct >= 100 ? 'complete' : monthPnL >= 0 ? 'on-track' : 'behind';
    return {
      progressPct: Math.max(0, pct),
      primaryLabel: `$${monthPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $${cfg.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      secondaryLabel: `${pct.toFixed(1)}% of monthly target`,
      status,
    };
  }

  if (goal.type === 'consistency') {
    const cfg = goal.config as unknown as ConsistencyConfig;
    const threshold =
      cfg.greenDayDefinition === 'min_amount' ? (cfg.greenDayMinAmount ?? 0) :
      cfg.greenDayDefinition === 'min_percent' ? (cfg.greenDayMinPercent ?? 0) : 0;
    const streak = computeGreenStreak(trades, threshold);
    const pct = Math.min((streak / cfg.targetDays) * 100, 100);
    const status = pct >= 100 ? 'complete' : 'on-track';
    return {
      progressPct: pct,
      primaryLabel: `${streak} / ${cfg.targetDays} green days`,
      secondaryLabel: streak > 0 ? `${streak}-day streak active 🔥` : 'Start your streak today',
      status,
    };
  }

  if (goal.type === 'discipline') {
    const cfg = goal.config as unknown as DisciplineConfig;
    // Compliance days = consecutive days where user traded <= maxDailyTrades
    // We approximate by checking days with trades
    const byDate = new Map<string, number>();
    for (const t of trades.filter((t) => t.status === 'closed' && t.date >= goal.start_date)) {
      byDate.set(t.date, (byDate.get(t.date) ?? 0) + 1);
    }
    const dates = [...byDate.keys()].sort().reverse();
    let streak = 0;
    for (const date of dates) {
      if ((byDate.get(date) ?? 0) <= cfg.maxDailyTrades) streak++;
      else break;
    }
    const pct = Math.min((streak / cfg.successTargetDays) * 100, 100);
    return {
      progressPct: pct,
      primaryLabel: `${streak} / ${cfg.successTargetDays} compliant days`,
      secondaryLabel: `Max ${cfg.maxDailyTrades} trades/day`,
      status: pct >= 100 ? 'complete' : 'on-track',
    };
  }

  // custom
  const pct = goal.target_value && goal.target_value > 0
    ? Math.min(((goal.target_value ?? 0) / goal.target_value) * 100, 100)
    : 0;
  return {
    progressPct: pct,
    primaryLabel: `Target: ${goal.target_value} ${goal.target_unit ?? ''}`,
    secondaryLabel: goal.deadline ? `Due ${goal.deadline}` : 'Ongoing',
    status: 'on-track',
  };
}

interface Props {
  goal: Goal;
}

export default function GoalCard({ goal }: Props) {
  const { updateGoal, deleteGoal } = useGoalStore();
  const { trades } = useTradeStore();
  const [showMenu, setShowMenu] = useState(false);

  const meta = TYPE_META[goal.type];
  const Icon = meta.icon;
  const { progressPct, primaryLabel, secondaryLabel, status } = computeProgress(goal, trades);

  const daysLeft = goal.deadline
    ? Math.max(0, differenceInCalendarDays(new Date(goal.deadline + 'T00:00:00'), new Date()))
    : null;

  const statusColors = {
    ahead:    'text-green-400',
    'on-track': 'text-blue-400',
    behind:   'text-red-400',
    complete: 'text-yellow-400',
  };

  const statusLabels = {
    ahead:    'Ahead',
    'on-track': 'On Track',
    behind:   'Behind',
    complete: 'Complete!',
  };

  async function handleComplete() {
    await updateGoal(goal.id, { status: 'completed', completed_at: new Date().toISOString() });
    setShowMenu(false);
  }

  async function handleAbandon() {
    await updateGoal(goal.id, { status: 'abandoned' });
    setShowMenu(false);
  }

  async function handleDelete() {
    await deleteGoal(goal.id);
    setShowMenu(false);
  }

  return (
    <div className={clsx('relative rounded-2xl border p-5 bg-[#0f1219] flex flex-col gap-4', meta.border)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', meta.bg)}>
            <Icon className={clsx('w-4.5 h-4.5', meta.color)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{goal.title}</p>
            {goal.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{goal.description}</p>
            )}
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-[#1a1f2e] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-40 bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl shadow-xl overflow-hidden">
              <button
                onClick={handleComplete}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-green-400 hover:bg-[#2a2f3e] transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Mark Complete
              </button>
              <button
                onClick={handleAbandon}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-orange-400 hover:bg-[#2a2f3e] transition-colors"
              >
                <Flag className="w-3.5 h-3.5" /> Abandon
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-[#2a2f3e] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-lg font-bold text-white">{primaryLabel}</span>
          <span className={clsx('text-xs font-semibold', statusColors[status])}>{statusLabels[status]}</span>
        </div>
        <div className="h-2 rounded-full bg-[#1a1f2e] overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', meta.bar)}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-500">{secondaryLabel}</span>
          <span className="text-xs text-gray-500">{progressPct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#1a1f2e]">
        <span className="text-xs text-gray-600">
          Started {format(new Date(goal.start_date), 'MMM d')}
        </span>
        {daysLeft !== null ? (
          <span className={clsx('text-xs font-medium', daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-orange-400' : 'text-gray-500')}>
            {daysLeft === 0 ? 'Due today!' : `${daysLeft}d remaining`}
          </span>
        ) : (
          <span className="text-xs text-gray-600">No deadline</span>
        )}
      </div>
    </div>
  );
}
