'use client';

import { useState } from 'react';
import { Plus, Trophy, Flame, CheckCircle2, XCircle } from 'lucide-react';
import { useGoalStore } from '@/store/useGoalStore';
import { useTradeStore } from '@/store/useTradeStore';
import GoalCard from '@/components/GoalCard';
import GoalWizard from '@/components/GoalWizard';

export default function GoalsPage() {
  const { goals, loading } = useGoalStore();
  const { trades } = useTradeStore();
  const [showWizard, setShowWizard] = useState(false);

  const activeGoals    = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const inactiveGoals  = goals.filter((g) => g.status === 'failed' || g.status === 'abandoned');

  // Compute green day streak from trades
  const closed = trades.filter((t) => t.status === 'closed' && t.pnl != null);
  const byDate = new Map<string, number>();
  for (const t of closed) {
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + (t.pnl ?? 0));
  }
  const sortedDates = [...byDate.keys()].sort().reverse();
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  for (const date of [...sortedDates].reverse()) {
    if ((byDate.get(date) ?? 0) > 0) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  if (sortedDates.length > 0 && (byDate.get(sortedDates[0]) ?? 0) > 0) {
    for (const date of sortedDates) {
      if ((byDate.get(date) ?? 0) > 0) currentStreak++;
      else break;
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trading Goals</h1>
          <p className="text-sm text-gray-500 mt-1">Set smart goals. Track daily. Build winning habits.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active Goals',    value: activeGoals.length,    color: 'text-blue-400',   icon: Trophy },
          { label: 'Goals Completed', value: completedGoals.length, color: 'text-green-400',  icon: CheckCircle2 },
          { label: 'Green Streak',    value: `${currentStreak}d`,   color: 'text-orange-400', icon: Flame },
          { label: 'Best Streak',     value: `${bestStreak}d`,      color: 'text-yellow-400', icon: Flame },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-[#1a1f2e] bg-[#0f1219] p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Goals */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeGoals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2a2f3e] p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">No active goals</p>
          <p className="text-sm text-gray-600 mb-5">Set a goal and the system will ask you the right questions.</p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active — {activeGoals.length}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Completed — {completedGoals.length}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Abandoned / Failed */}
      {inactiveGoals.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-gray-600" />
            Inactive — {inactiveGoals.length}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
            {inactiveGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {showWizard && <GoalWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
