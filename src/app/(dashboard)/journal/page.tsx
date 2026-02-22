'use client';

import { useState, useEffect } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Sun, Moon, BookOpen, TrendingUp, Save } from 'lucide-react';
import { useGoalStore } from '@/store/useGoalStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import clsx from 'clsx';

const MOODS = [
  { val: 1, emoji: '😤', label: 'Frustrated' },
  { val: 2, emoji: '😐', label: 'Flat' },
  { val: 3, emoji: '😊', label: 'Good' },
  { val: 4, emoji: '😄', label: 'Great' },
  { val: 5, emoji: '🔥', label: 'On Fire' },
];

const BIAS_OPTIONS = [
  { id: 'bullish',  label: 'Bullish',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  { id: 'bearish',  label: 'Bearish',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  { id: 'neutral',  label: 'Neutral',  color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/30' },
  { id: 'mixed',    label: 'Mixed',    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
] as const;

export default function JournalPage() {
  const { fetchJournal, upsertJournal } = useGoalStore();
  const { activeAccount, loading: accountsLoading } = useAccountStore();
  const { trades } = useTradeStore();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Morning fields
  const [bias, setBias] = useState<'bullish' | 'bearish' | 'neutral' | 'mixed' | null>(null);
  const [plannedPairs, setPlannedPairs] = useState('');
  const [preNotes, setPreNotes] = useState('');
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [rulesReviewed, setRulesReviewed] = useState(false);

  // Evening fields
  const [postNotes, setPostNotes] = useState('');
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [lessons, setLessons] = useState('');
  const [followedRules, setFollowedRules] = useState<boolean | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;
  const isPast = selectedDate < today;
  const isFuture = selectedDate > today;
  const tradingHoursOver = new Date().getHours() >= 16; // 4pm heuristic
  const saveDisabled = saving || !activeAccount || isFuture;

  function clearForm() {
    setBias(null);
    setPlannedPairs('');
    setPreNotes('');
    setMoodBefore(null);
    setRulesReviewed(false);
    setPostNotes('');
    setMoodAfter(null);
    setLessons('');
    setFollowedRules(null);
  }

  // Load journal entry when selected date or account changes
  useEffect(() => {
    let active = true;

    async function loadJournal() {
      if (!activeAccount?.id) {
        clearForm();
        return;
      }

      const journal = await fetchJournal(activeAccount.id, selectedDate);
      if (!active) return;

      if (!journal) {
        clearForm();
        return;
      }

      setBias(journal.market_bias);
      setPlannedPairs(journal.planned_pairs?.join(', ') ?? '');
      setPreNotes(journal.pre_market_notes ?? '');
      setMoodBefore(journal.mood_before);
      setRulesReviewed(journal.rules_reviewed);
      setPostNotes(journal.post_market_notes ?? '');
      setMoodAfter(journal.mood_after);
      setLessons(journal.lessons_learned ?? '');
      setFollowedRules(journal.followed_rules);
    }

    void loadJournal();
    return () => { active = false; };
  }, [activeAccount?.id, selectedDate, fetchJournal]);

  // Today's trade stats
  const dayTrades = trades.filter((t) => t.date === selectedDate && t.status === 'closed');
  const dayPnL = dayTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  async function handleSave() {
    if (!activeAccount?.id || isFuture) return;
    setSaving(true);
    setSaveError(null);
    try {
      const pairs = plannedPairs.split(',').map((s) => s.trim()).filter(Boolean);
      const result = await upsertJournal(activeAccount.id, selectedDate, {
        market_bias: bias,
        planned_pairs: pairs,
        pre_market_notes: preNotes || null,
        mood_before: moodBefore,
        rules_reviewed: rulesReviewed,
        post_market_notes: postNotes || null,
        mood_after: moodAfter,
        lessons_learned: lessons || null,
        followed_rules: followedRules,
      });

      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return;
      }

      setSaveError(result.error ?? 'Failed to save journal entry.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unexpected save error.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  function navigateDate(dir: -1 | 1) {
    const d = new Date(selectedDate + 'T00:00:00');
    setSelectedDate(format(dir === -1 ? subDays(d, 1) : addDays(d, 1), 'yyyy-MM-dd'));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daily Journal</h1>
          <p className="text-sm text-gray-500 mt-1">Morning prep + evening review = elite consistency</p>
        </div>
        {!isFuture && (
          <button
            onClick={handleSave}
            disabled={saveDisabled}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              saved
                ? 'bg-green-600/20 border border-green-500/30 text-green-400'
                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
            )}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Journal'}
          </button>
        )}
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-3 mb-6 bg-[#0f1219] border border-[#1a1f2e] rounded-xl p-1">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 rounded-lg hover:bg-[#1a1f2e] text-gray-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-white">{format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</p>
          {isToday && <span className="text-xs text-blue-400">Today</span>}
        </div>
        <button
          onClick={() => navigateDate(1)}
          disabled={selectedDate >= today}
          className="p-2 rounded-lg hover:bg-[#1a1f2e] text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day stats if there are trades */}
      {dayTrades.length > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 rounded-xl bg-[#0f1219] border border-[#1a1f2e] p-4 flex items-center gap-3">
            <TrendingUp className={clsx('w-5 h-5', dayPnL >= 0 ? 'text-green-400' : 'text-red-400')} />
            <div>
              <p className={clsx('text-lg font-bold', dayPnL >= 0 ? 'text-green-400' : 'text-red-400')}>
                {dayPnL >= 0 ? '+' : ''}{dayPnL.toLocaleString(undefined, { style: 'currency', currency: activeAccount?.currency ?? 'USD', maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">{dayTrades.length} trade{dayTrades.length !== 1 ? 's' : ''} today</p>
            </div>
          </div>
          <div className="flex-1 rounded-xl bg-[#0f1219] border border-[#1a1f2e] p-4 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-lg font-bold text-white">
                {dayTrades.filter((t) => (t.pnl ?? 0) > 0).length}W / {dayTrades.filter((t) => (t.pnl ?? 0) < 0).length}L
              </p>
              <p className="text-xs text-gray-500">Win / Loss</p>
            </div>
          </div>
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <p className="text-xs text-red-300">{saveError}</p>
        </div>
      )}

      {!activeAccount && (
        <div className="mb-4 rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-3">
          <p className="text-xs text-yellow-300">
            {accountsLoading
              ? 'Loading your accounts...'
              : 'No active account selected. Choose or create one in Settings to enable journal saving.'}
          </p>
        </div>
      )}

      {/* ── Morning Section ── */}
      <div className="rounded-2xl border border-[#1a1f2e] bg-[#0f1219] overflow-hidden mb-4">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#1a1f2e]">
          <Sun className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-white">Morning Prep</span>
          <span className="ml-auto text-xs text-gray-600">Before you trade</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Market bias */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Market Bias Today</label>
            <div className="flex gap-2">
              {BIAS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBias(opt.id)}
                  className={clsx(
                    'flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all',
                    bias === opt.id ? `${opt.bg} ${opt.color}` : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-500 hover:text-white'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Planned pairs */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Pairs to Watch</label>
            <input
              type="text"
              value={plannedPairs}
              onChange={(e) => setPlannedPairs(e.target.value)}
              placeholder="e.g. EURUSD, GBPJPY, Gold"
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Pre-market notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Pre-Market Notes</label>
            <textarea
              value={preNotes}
              onChange={(e) => setPreNotes(e.target.value)}
              rows={3}
              placeholder="Key levels, news events, your trading plan for today..."
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Mood before */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">How are you feeling?</label>
            <div className="flex gap-2">
              {MOODS.map(({ val, emoji, label }) => (
                <button
                  key={val}
                  onClick={() => setMoodBefore(val)}
                  title={label}
                  className={clsx(
                    'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all',
                    moodBefore === val
                      ? 'bg-[#2a2f3e] border-blue-500/40 scale-105'
                      : 'bg-[#1a1f2e] border-[#2a2f3e] hover:border-[#3a3f4e] opacity-60 hover:opacity-100'
                  )}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[10px] text-gray-500">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rules reviewed */}
          <button
            onClick={() => setRulesReviewed(!rulesReviewed)}
            className={clsx(
              'flex items-center gap-3 w-full p-3 rounded-xl border transition-all text-left',
              rulesReviewed
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-[#1a1f2e] border-[#2a2f3e] hover:border-[#3a3f4e]'
            )}
          >
            <div className={clsx(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0',
              rulesReviewed ? 'bg-green-500 border-green-500' : 'border-gray-600'
            )}>
              {rulesReviewed && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className={clsx('text-sm font-medium', rulesReviewed ? 'text-green-400' : 'text-gray-400')}>
              I have reviewed my trading rules
            </span>
          </button>
        </div>
      </div>

      {/* ── Evening Section ── */}
      <div className={clsx(
        'rounded-2xl border bg-[#0f1219] overflow-hidden',
        !isToday || tradingHoursOver || (isPast) ? 'border-[#1a1f2e]' : 'border-[#1a1f2e] opacity-60'
      )}>
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#1a1f2e]">
          <Moon className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Evening Review</span>
          <span className="ml-auto text-xs text-gray-600">After market close</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Post-market notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">How did today go?</label>
            <textarea
              value={postNotes}
              onChange={(e) => setPostNotes(e.target.value)}
              rows={3}
              placeholder="What worked? What didn't? What surprised you?"
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Lessons */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Key Lesson or Insight</label>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              rows={2}
              placeholder="One thing you learned or want to remember for next time..."
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Followed rules */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Did you follow your trading rules?</label>
            <div className="flex gap-2">
              {[
                { val: true,  label: 'Yes — stayed disciplined', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
                { val: false, label: 'No — broke some rules',    color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/30' },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => setFollowedRules(opt.val)}
                  className={clsx(
                    'flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all',
                    followedRules === opt.val
                      ? `${opt.bg} ${opt.color}`
                      : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-500 hover:text-white'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* End of day mood */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">How do you feel after today&apos;s session?</label>
            <div className="flex gap-2">
              {MOODS.map(({ val, emoji, label }) => (
                <button
                  key={val}
                  onClick={() => setMoodAfter(val)}
                  title={label}
                  className={clsx(
                    'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all',
                    moodAfter === val
                      ? 'bg-[#2a2f3e] border-blue-500/40 scale-105'
                      : 'bg-[#1a1f2e] border-[#2a2f3e] hover:border-[#3a3f4e] opacity-60 hover:opacity-100'
                  )}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[10px] text-gray-500">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save button at bottom for convenience */}
      {!isFuture && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saveDisabled}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
              saved
                ? 'bg-green-600/20 border border-green-500/30 text-green-400'
                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
            )}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Journal Saved!' : saving ? 'Saving...' : 'Save Journal'}
          </button>
        </div>
      )}

      {!activeAccount && !accountsLoading && (
        <p className="text-xs text-gray-600 text-center mt-4">Create an account in Settings to save your journal.</p>
      )}
    </div>
  );
}
