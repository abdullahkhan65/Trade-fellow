'use client';

import { useState } from 'react';
import { Trophy, TrendingUp, Flame, Shield, Star, BookOpen, Smile, ChevronRight } from 'lucide-react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountStore } from '@/store/useAccountStore';
import { format } from 'date-fns';
import clsx from 'clsx';
import Link from 'next/link';
import type { Goal, ChallengeConfig, MonthlyProfitConfig, ConsistencyConfig, DisciplineConfig } from '@/types';
import type { Trade } from '@/types';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  challenge:      Trophy,
  monthly_profit: TrendingUp,
  consistency:    Flame,
  discipline:     Shield,
  custom:         Star,
};

const TYPE_COLORS: Record<string, string> = {
  challenge:      'text-yellow-400',
  monthly_profit: 'text-green-400',
  consistency:    'text-orange-400',
  discipline:     'text-blue-400',
  custom:         'text-purple-400',
};

const MOODS = ['😤', '😐', '😊', '😄', '🔥'];

function computeGreenStreak(trades: Trade[]): number {
  const closed = trades.filter((t) => t.status === 'closed' && t.pnl != null);
  const byDate = new Map<string, number>();
  for (const t of closed) {
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + (t.pnl ?? 0));
  }
  const dates = [...byDate.keys()].sort().reverse();
  let streak = 0;
  for (const date of dates) {
    if ((byDate.get(date) ?? 0) > 0) streak++;
    else break;
  }
  return streak;
}

function getDailyTarget(goal: Goal, trades: Trade[]): string {
  const today = format(new Date(), 'yyyy-MM-dd');
  const thisMonth = today.slice(0, 7);

  if (goal.type === 'challenge') {
    const cfg = goal.config as unknown as ChallengeConfig;
    const totalPnL = trades.filter((t) => t.status === 'closed' && t.date >= goal.start_date).reduce((s, t) => s + (t.pnl ?? 0), 0);
    const remaining = cfg.profitTargetAmount - totalPnL;
    if (remaining <= 0) return `Target reached! Protect your gains.`;
    return `+$${cfg.dailyProfitNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })} needed today — max loss $${(cfg.accountSize * cfg.maxDailyLossPercent / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  if (goal.type === 'monthly_profit') {
    const cfg = goal.config as unknown as MonthlyProfitConfig;
    const monthPnL = trades.filter((t) => t.status === 'closed' && t.date.startsWith(thisMonth)).reduce((s, t) => s + (t.pnl ?? 0), 0);
    const remaining = cfg.targetAmount - monthPnL;
    if (remaining <= 0) return `Monthly target hit! Protect profits.`;
    const daysLeftInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
    const dailyNeeded = daysLeftInMonth > 0 ? remaining / daysLeftInMonth : remaining;
    return `+$${dailyNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })} needed/day — $${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} to target`;
  }

  if (goal.type === 'consistency') {
    const streak = computeGreenStreak(trades);
    const cfg = goal.config as unknown as ConsistencyConfig;
    if (streak >= cfg.targetDays) return `${streak}-day streak complete! Keep going!`;
    return `${streak > 0 ? `Protect your ${streak}-day streak` : 'Start your streak today'} — finish in the green`;
  }

  if (goal.type === 'discipline') {
    const cfg = goal.config as unknown as DisciplineConfig;
    const todayTrades = trades.filter((t) => t.date === today && t.status === 'closed').length;
    const remaining = Math.max(0, cfg.maxDailyTrades - todayTrades);
    return `Max ${cfg.maxDailyTrades} trades today — ${todayTrades} taken, ${remaining} left`;
  }

  return goal.description ?? `Work toward: ${goal.title}`;
}

export default function DailyMission() {
  const { goals, todayJournal, upsertJournal } = useGoalStore();
  const { trades } = useTradeStore();
  const { activeAccount } = useAccountStore();
  const [savingMood, setSavingMood] = useState(false);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTrades = trades.filter((t) => t.date === today);
  const todayPnL = todayTrades.filter((t) => t.status === 'closed').reduce((s, t) => s + (t.pnl ?? 0), 0);
  const greenStreak = computeGreenStreak(trades);

  async function handleMood(mood: number) {
    if (!activeAccount?.id || savingMood) return;
    setSavingMood(true);
    const field = todayPnL !== 0 || todayTrades.length > 0 ? 'mood_after' : 'mood_before';
    await upsertJournal(activeAccount.id, today, { [field]: mood });
    setSavingMood(false);
  }

  // Don't render if no active goals and no account
  if (activeGoals.length === 0 && !activeAccount) return null;

  const currentMood = todayJournal?.mood_after ?? todayJournal?.mood_before ?? null;

  return (
    <div className="rounded-2xl border border-[#1a1f2e] bg-[#0f1219] p-5 mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Today&apos;s Mission</p>
          <p className="text-base font-bold text-white mt-0.5">{format(new Date(), 'EEEE, MMM d')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Green day streak */}
          {greenStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{greenStreak}-day streak</span>
            </div>
          )}
          {/* Today PnL chip */}
          {(todayTrades.length > 0) && (
            <div className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold',
              todayPnL >= 0
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            )}>
              {todayPnL >= 0 ? '+' : ''}{todayPnL.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0, style: 'currency', currency: activeAccount?.currency ?? 'USD' })}
            </div>
          )}
        </div>
      </div>

      {/* Goal targets */}
      {activeGoals.length > 0 ? (
        <div className="space-y-2 mb-4">
          {activeGoals.slice(0, 3).map((goal) => {
            const Icon = TYPE_ICONS[goal.type] ?? Star;
            const color = TYPE_COLORS[goal.type] ?? 'text-gray-400';
            const target = getDailyTarget(goal, trades);
            return (
              <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1f2e]">
                <Icon className={clsx('w-4 h-4 shrink-0', color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 leading-snug">{target}</p>
                </div>
              </div>
            );
          })}
          {activeGoals.length > 3 && (
            <p className="text-xs text-gray-600 pl-3">+{activeGoals.length - 3} more goals</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1f2e] mb-4">
          <Star className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="text-xs text-gray-400">No active goals — <Link href="/goals" className="text-blue-400 hover:underline">create your first goal</Link></p>
        </div>
      )}

      {/* Footer row: mood + journal link */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1a1f2e]">
        {/* Mood check */}
        <div className="flex items-center gap-2">
          <Smile className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-xs text-gray-600">Mood:</span>
          <div className="flex gap-1">
            {MOODS.map((emoji, i) => {
              const moodVal = i + 1;
              return (
                <button
                  key={moodVal}
                  onClick={() => handleMood(moodVal)}
                  disabled={savingMood}
                  title={`Mood ${moodVal}/5`}
                  className={clsx(
                    'text-base transition-all hover:scale-125 disabled:opacity-50',
                    currentMood === moodVal ? 'scale-125 opacity-100' : 'opacity-50 hover:opacity-100'
                  )}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <Link
          href="/journal"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1f2e] hover:bg-[#2a2f3e] text-xs text-gray-400 hover:text-white transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {todayJournal ? 'View Journal' : 'Write Journal'}
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
