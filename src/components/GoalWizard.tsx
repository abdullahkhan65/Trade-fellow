'use client';

import { useState } from 'react';
import { X, Trophy, TrendingUp, Flame, Shield, Star, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useGoalStore } from '@/store/useGoalStore';
import { useAccountStore } from '@/store/useAccountStore';
import type { GoalType, ChallengeConfig, MonthlyProfitConfig, ConsistencyConfig, DisciplineConfig, CustomConfig } from '@/types';
import { addBusinessDays, format, differenceInBusinessDays } from 'date-fns';

interface Props {
  onClose: () => void;
}

const GOAL_TYPES = [
  {
    id: 'challenge' as GoalType,
    icon: Trophy,
    title: 'Pass Prop Firm Challenge',
    description: 'Hit your profit target while respecting firm rules',
    color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    iconColor: 'text-yellow-400',
  },
  {
    id: 'monthly_profit' as GoalType,
    icon: TrendingUp,
    title: 'Monthly Profit Target',
    description: 'Hit a specific profit goal by end of the month',
    color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    iconColor: 'text-green-400',
  },
  {
    id: 'consistency' as GoalType,
    icon: Flame,
    title: 'Green Day Streak',
    description: 'Build consecutive profitable trading days',
    color: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  {
    id: 'discipline' as GoalType,
    icon: Shield,
    title: 'Trading Discipline',
    description: 'Follow your rules consistently for X days',
    color: 'from-blue-500/20 to-purple-500/20 border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  {
    id: 'custom' as GoalType,
    icon: Star,
    title: 'Custom Goal',
    description: 'Define your own specific measurable goal',
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    iconColor: 'text-purple-400',
  },
] as const;

const PROP_FIRMS = [
  { id: 'ftmo', name: 'FTMO', profitTarget: 10, dailyLoss: 5, maxDD: 10 },
  { id: 'myfundedfx', name: 'MyFundedFX', profitTarget: 8, dailyLoss: 4, maxDD: 8 },
  { id: 'tft', name: 'The Funded Trader', profitTarget: 12, dailyLoss: 5, maxDD: 12 },
  { id: 'e8', name: 'E8 Funding', profitTarget: 8, dailyLoss: 5, maxDD: 8 },
  { id: 'apex', name: 'Apex Trader', profitTarget: 9, dailyLoss: 3, maxDD: 6 },
  { id: 'custom', name: 'Other / Custom', profitTarget: 10, dailyLoss: 5, maxDD: 10 },
];

const DISCIPLINE_ISSUES = [
  { id: 'overtrading', label: 'Overtrading', desc: 'Taking too many trades beyond my plan' },
  { id: 'revenge_trading', label: 'Revenge Trading', desc: 'Trading emotionally after a loss' },
  { id: 'fomo', label: 'FOMO', desc: 'Chasing trades I originally missed' },
  { id: 'poor_exits', label: 'Poor Exits', desc: 'Moving SL or cutting winners too early' },
  { id: 'not_following_plan', label: 'Not Following Plan', desc: 'Deviating from my trading setup criteria' },
];

function countBusinessDaysToDate(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline + 'T00:00:00');
  if (end <= today) return 0;
  return Math.max(0, differenceInBusinessDays(end, today));
}

function defaultDeadlineEndOfMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return format(d, 'yyyy-MM-dd');
}

function defaultChallengeDeadline(): string {
  return format(addBusinessDays(new Date(), 30), 'yyyy-MM-dd');
}

export default function GoalWizard({ onClose }: Props) {
  const { createGoal } = useGoalStore();
  const { activeAccount } = useAccountStore();

  const [step, setStep] = useState(0);
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Challenge fields
  const [firm, setFirm] = useState(PROP_FIRMS[0]);
  const [phase, setPhase] = useState<'phase1' | 'phase2' | 'funded'>('phase1');
  const [accountSize, setAccountSize] = useState(activeAccount?.starting_balance ?? 100000);
  const [profitTargetPct, setProfitTargetPct] = useState(10);
  const [dailyLossPct, setDailyLossPct] = useState(5);
  const [maxDDPct, setMaxDDPct] = useState(10);
  const [challengeDeadline, setChallengeDeadline] = useState(defaultChallengeDeadline());
  const [tradeDaysPerWeek, setTradeDaysPerWeek] = useState(5);
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState(1);

  // ── Monthly profit fields
  const [mpTargetType, setMpTargetType] = useState<'amount' | 'percent'>('percent');
  const [mpTargetAmount, setMpTargetAmount] = useState(2000);
  const [mpTargetPercent, setMpTargetPercent] = useState(5);
  const [mpDeadline, setMpDeadline] = useState(defaultDeadlineEndOfMonth());

  // ── Consistency fields
  const [streakTarget, setStreakTarget] = useState(10);
  const [greenDayDef, setGreenDayDef] = useState<'any_profit' | 'min_amount' | 'min_percent'>('any_profit');
  const [greenDayMinAmt, setGreenDayMinAmt] = useState(100);
  const [greenDayMinPct, setGreenDayMinPct] = useState(0.5);

  // ── Discipline fields
  const [mainIssue, setMainIssue] = useState<DisciplineConfig['mainIssue']>('overtrading');
  const [maxDailyTrades, setMaxDailyTrades] = useState(3);
  const [rules, setRules] = useState<string[]>(['']);
  const [successDays, setSuccessDays] = useState(10);

  // ── Custom fields
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customMeasure, setCustomMeasure] = useState<CustomConfig['measureType']>('amount');
  const [customTarget, setCustomTarget] = useState(0);
  const [customDeadline, setCustomDeadline] = useState('');

  const selectedType = GOAL_TYPES.find((t) => t.id === goalType);

  const stepsForType = (): number => {
    if (!goalType) return 1;
    if (goalType === 'challenge') return 3;
    return 2;
  };

  const totalSteps = stepsForType();

  function handleFirmSelect(f: typeof PROP_FIRMS[number]) {
    setFirm(f);
    setProfitTargetPct(f.profitTarget);
    setDailyLossPct(f.dailyLoss);
    setMaxDDPct(f.maxDD);
  }

  function addRule() {
    if (rules.length < 5) setRules([...rules, '']);
  }
  function updateRule(i: number, val: string) {
    const updated = [...rules];
    updated[i] = val;
    setRules(updated);
  }
  function removeRule(i: number) {
    setRules(rules.filter((_, idx) => idx !== i));
  }

  async function handleCreate() {
    if (!goalType) return;
    setSaving(true);

    let title = '';
    let description: string | null = null;
    let target_value: number | null = null;
    let target_unit: string | null = null;
    let deadline: string | null = null;
    let config: Record<string, unknown> = {};

    if (goalType === 'challenge') {
      const daysRemaining = countBusinessDaysToDate(challengeDeadline);
      const profitTargetAmount = accountSize * (profitTargetPct / 100);
      const dailyProfitNeeded = daysRemaining > 0 ? profitTargetAmount / daysRemaining : profitTargetAmount;
      const cfg: ChallengeConfig = {
        propFirm: firm.id,
        propFirmName: firm.name,
        phase,
        accountSize,
        profitTargetPercent: profitTargetPct,
        profitTargetAmount,
        maxDailyLossPercent: dailyLossPct,
        maxDrawdownPercent: maxDDPct,
        deadline: challengeDeadline,
        tradingDaysPerWeek: tradeDaysPerWeek,
        maxRiskPerTrade,
        tradingDaysRemaining: daysRemaining,
        dailyProfitNeeded,
      };
      config = cfg as unknown as Record<string, unknown>;
      title = `Pass ${firm.name} ${phase === 'phase1' ? 'Phase 1' : phase === 'phase2' ? 'Phase 2' : 'Funded'} Challenge`;
      description = `Hit ${profitTargetPct}% profit target ($${profitTargetAmount.toLocaleString()}) by ${challengeDeadline}`;
      target_value = profitTargetAmount;
      target_unit = activeAccount?.currency ?? 'USD';
      deadline = challengeDeadline;
    } else if (goalType === 'monthly_profit') {
      const balance = activeAccount?.starting_balance ?? 100000;
      const amount = mpTargetType === 'amount' ? mpTargetAmount : balance * (mpTargetPercent / 100);
      const pct = mpTargetType === 'percent' ? mpTargetPercent : (mpTargetAmount / balance) * 100;
      const cfg: MonthlyProfitConfig = {
        targetType: mpTargetType,
        targetAmount: amount,
        targetPercent: pct,
        deadline: mpDeadline,
        startingBalance: balance,
      };
      config = cfg as unknown as Record<string, unknown>;
      title = `Hit $${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} Monthly Target`;
      description = `${pct.toFixed(1)}% profit by ${mpDeadline}`;
      target_value = amount;
      target_unit = activeAccount?.currency ?? 'USD';
      deadline = mpDeadline;
    } else if (goalType === 'consistency') {
      const cfg: ConsistencyConfig = {
        targetDays: streakTarget,
        greenDayDefinition: greenDayDef,
        greenDayMinAmount: greenDayDef === 'min_amount' ? greenDayMinAmt : undefined,
        greenDayMinPercent: greenDayDef === 'min_percent' ? greenDayMinPct : undefined,
      };
      config = cfg as unknown as Record<string, unknown>;
      title = `${streakTarget}-Day Green Streak`;
      description = `${streakTarget} consecutive profitable trading days`;
      target_value = streakTarget;
      target_unit = 'days';
    } else if (goalType === 'discipline') {
      const issue = DISCIPLINE_ISSUES.find((d) => d.id === mainIssue);
      const cfg: DisciplineConfig = {
        mainIssue,
        maxDailyTrades,
        tradingRules: rules.filter((r) => r.trim().length > 0),
        successTargetDays: successDays,
      };
      config = cfg as unknown as Record<string, unknown>;
      title = `Overcome ${issue?.label ?? 'Discipline Issue'}`;
      description = `Follow all rules for ${successDays} consecutive days`;
      target_value = successDays;
      target_unit = 'days';
    } else if (goalType === 'custom') {
      const cfg: CustomConfig = {
        measureType: customMeasure,
        targetValue: customTarget,
        notes: customDesc,
      };
      config = cfg as unknown as Record<string, unknown>;
      title = customTitle || 'My Custom Goal';
      description = customDesc || null;
      target_value = customTarget || null;
      const unitMap: Record<CustomConfig['measureType'], string> = {
        amount: activeAccount?.currency ?? 'USD',
        percent: '%',
        days: 'days',
        trades: 'trades',
        r_multiples: 'R',
      };
      target_unit = unitMap[customMeasure];
      deadline = customDeadline || null;
    }

    await createGoal({
      account_id: activeAccount?.id ?? null,
      type: goalType,
      title,
      description,
      target_value,
      target_unit,
      start_date: new Date().toISOString().slice(0, 10),
      deadline,
      config,
      status: 'active',
      completed_at: null,
    });

    setSaving(false);
    onClose();
  }

  // ── Render step content ──────────────────────────────────────────────────
  function renderStepContent() {
    // Step 0: goal type selection
    if (step === 0) {
      return (
        <div>
          <h2 className="text-xl font-bold text-white mb-1">What do you want to achieve?</h2>
          <p className="text-sm text-gray-400 mb-6">Choose a goal type — we&apos;ll ask the right questions to set it up properly.</p>
          <div className="grid grid-cols-1 gap-3">
            {GOAL_TYPES.map((gt) => {
              const Icon = gt.icon;
              const selected = goalType === gt.id;
              return (
                <button
                  key={gt.id}
                  onClick={() => setGoalType(gt.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r text-left transition-all ${gt.color} ${
                    selected ? 'ring-2 ring-white/30 scale-[1.01]' : 'hover:scale-[1.005]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0 ${gt.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{gt.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{gt.description}</p>
                  </div>
                  {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Challenge steps
    if (goalType === 'challenge') {
      if (step === 1) return renderChallengeStep1();
      if (step === 2) return renderChallengeStep2();
    }
    if (goalType === 'monthly_profit' && step === 1) return renderMonthlyStep();
    if (goalType === 'consistency' && step === 1) return renderConsistencyStep();
    if (goalType === 'discipline' && step === 1) return renderDisciplineStep();
    if (goalType === 'custom' && step === 1) return renderCustomStep();

    return null;
  }

  function renderChallengeStep1() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Which prop firm?</h2>
          <p className="text-sm text-gray-400 mb-4">We&apos;ll pre-fill the rules. You can adjust them.</p>
          <div className="grid grid-cols-2 gap-2">
            {PROP_FIRMS.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFirmSelect(f)}
                className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                  firm.id === f.id
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white hover:border-[#3a3f4e]'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Account Size ({activeAccount?.currency ?? 'USD'})</label>
          <input
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(Number(e.target.value))}
            className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Profit Target %</label>
            <input
              type="number"
              step="0.5"
              value={profitTargetPct}
              onChange={(e) => setProfitTargetPct(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Daily Loss Limit %</label>
            <input
              type="number"
              step="0.5"
              value={dailyLossPct}
              onChange={(e) => setDailyLossPct(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Max Drawdown %</label>
            <input
              type="number"
              step="0.5"
              value={maxDDPct}
              onChange={(e) => setMaxDDPct(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">What phase are you in?</label>
          <div className="flex gap-2">
            {(['phase1', 'phase2', 'funded'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                  phase === p
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white'
                }`}
              >
                {p === 'phase1' ? 'Phase 1' : p === 'phase2' ? 'Phase 2' : 'Funded'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderChallengeStep2() {
    const daysLeft = countBusinessDaysToDate(challengeDeadline);
    const profitTarget = accountSize * (profitTargetPct / 100);
    const dailyNeeded = daysLeft > 0 ? profitTarget / daysLeft : profitTarget;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Timeline & Trading Plan</h2>
          <p className="text-sm text-gray-400 mb-4">Help us calculate your daily targets.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Challenge Deadline</label>
          <input
            type="date"
            value={challengeDeadline}
            onChange={(e) => setChallengeDeadline(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
          />
          <p className="text-xs text-gray-500 mt-1">{daysLeft} trading days remaining</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Trading Days Per Week</label>
          <div className="flex gap-2">
            {[3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => setTradeDaysPerWeek(d)}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  tradeDaysPerWeek === d
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Max Risk Per Trade (%)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={maxRiskPerTrade}
              onChange={(e) => setMaxRiskPerTrade(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm font-semibold text-white w-14 text-right">{maxRiskPerTrade}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            = ${(accountSize * maxRiskPerTrade / 100).toLocaleString()} per trade
          </p>
        </div>

        {/* Auto-calculated summary */}
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 space-y-2">
          <p className="text-xs font-semibold text-blue-400 mb-3">Your Auto-Calculated Plan</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Profit Target</span>
            <span className="text-white font-medium">${profitTarget.toLocaleString()} ({profitTargetPct}%)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Daily Profit Needed</span>
            <span className="text-green-400 font-medium">${dailyNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}/day</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Max Daily Loss</span>
            <span className="text-red-400 font-medium">${(accountSize * dailyLossPct / 100).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Max Loss Per Trade</span>
            <span className="text-orange-400 font-medium">${(accountSize * maxRiskPerTrade / 100).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  function renderMonthlyStep() {
    const balance = activeAccount?.starting_balance ?? 100000;
    const resolvedAmount = mpTargetType === 'amount' ? mpTargetAmount : balance * (mpTargetPercent / 100);
    const businessDaysLeft = countBusinessDaysToDate(mpDeadline);
    const dailyTarget = businessDaysLeft > 0 ? resolvedAmount / businessDaysLeft : resolvedAmount;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Set Your Monthly Target</h2>
          <p className="text-sm text-gray-400 mb-4">How much do you want to profit this month?</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Measure target in</label>
          <div className="flex gap-2">
            {(['amount', 'percent'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMpTargetType(t)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  mpTargetType === t
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white'
                }`}
              >
                {t === 'amount' ? 'Dollar Amount ($)' : 'Percentage (%)'}
              </button>
            ))}
          </div>
        </div>

        {mpTargetType === 'amount' ? (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Target Amount ({activeAccount?.currency ?? 'USD'})</label>
            <input
              type="number"
              value={mpTargetAmount}
              onChange={(e) => setMpTargetAmount(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Target Percentage (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={mpTargetPercent}
                onChange={(e) => setMpTargetPercent(Number(e.target.value))}
                className="flex-1 accent-green-500"
              />
              <span className="text-sm font-semibold text-white w-14 text-right">{mpTargetPercent}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">= ${resolvedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Deadline</label>
          <input
            type="date"
            value={mpDeadline}
            onChange={(e) => setMpDeadline(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
          />
          <p className="text-xs text-gray-500 mt-1">{businessDaysLeft} trading days left</p>
        </div>

        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
          <p className="text-xs font-semibold text-green-400 mb-2">Daily Target</p>
          <p className="text-2xl font-bold text-white">${dailyTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}<span className="text-sm text-gray-400 font-normal">/day</span></p>
          <p className="text-xs text-gray-500 mt-1">to hit your ${resolvedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} goal</p>
        </div>
      </div>
    );
  }

  function renderConsistencyStep() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Build Your Green Streak</h2>
          <p className="text-sm text-gray-400 mb-4">Consistency compounds over time. What&apos;s your target?</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Target Consecutive Green Days</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={streakTarget}
              onChange={(e) => setStreakTarget(Number(e.target.value))}
              className="flex-1 accent-orange-500"
            />
            <span className="text-2xl font-bold text-white w-14 text-right">{streakTarget}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>5 (starter)</span><span>20 (solid)</span><span>60 (elite)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-3">What counts as a &ldquo;green day&rdquo;?</label>
          <div className="space-y-2">
            {[
              { id: 'any_profit', label: 'Any profit at all', desc: 'Even $1 in the green counts' },
              { id: 'min_amount', label: 'Minimum dollar profit', desc: `At least $${greenDayMinAmt} profit` },
              { id: 'min_percent', label: 'Minimum % gain', desc: `At least ${greenDayMinPct}% of account` },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setGreenDayDef(opt.id as typeof greenDayDef)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  greenDayDef === opt.id
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                  greenDayDef === opt.id ? 'border-orange-400 bg-orange-400' : 'border-gray-600'
                }`}>
                  {greenDayDef === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {greenDayDef === 'min_amount' && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Minimum profit per day ($)</label>
            <input
              type="number"
              value={greenDayMinAmt}
              onChange={(e) => setGreenDayMinAmt(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        )}
        {greenDayDef === 'min_percent' && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Minimum % gain per day</label>
            <input
              type="number"
              step="0.1"
              value={greenDayMinPct}
              onChange={(e) => setGreenDayMinPct(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        )}
      </div>
    );
  }

  function renderDisciplineStep() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Build Trading Discipline</h2>
          <p className="text-sm text-gray-400 mb-4">Identify your weakness. Define your rules. Track compliance.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-3">What&apos;s your biggest challenge?</label>
          <div className="space-y-2">
            {DISCIPLINE_ISSUES.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setMainIssue(issue.id as DisciplineConfig['mainIssue'])}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  mainIssue === issue.id
                    ? 'bg-blue-500/10 border-blue-500/30 text-white'
                    : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${
                  mainIssue === issue.id ? 'border-blue-400 bg-blue-400' : 'border-gray-600'
                }`} />
                <div>
                  <p className="text-sm font-medium">{issue.label}</p>
                  <p className="text-xs text-gray-500">{issue.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Max trades per day</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setMaxDailyTrades(n)}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  maxDailyTrades === n
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400">Your Trading Rules</label>
            {rules.length < 5 && (
              <button onClick={addRule} className="text-xs text-blue-400 hover:text-blue-300">+ Add rule</button>
            )}
          </div>
          <div className="space-y-2">
            {rules.map((rule, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => updateRule(i, e.target.value)}
                  placeholder={`Rule ${i + 1}, e.g. No trades in first 30 min`}
                  className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                {rules.length > 1 && (
                  <button onClick={() => removeRule(i)} className="px-2 text-gray-600 hover:text-red-400 transition-colors">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Success = follow rules for how many consecutive days?</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={successDays}
              onChange={(e) => setSuccessDays(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xl font-bold text-white w-14 text-right">{successDays}</span>
          </div>
        </div>
      </div>
    );
  }

  function renderCustomStep() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Define Your Goal</h2>
          <p className="text-sm text-gray-400 mb-4">Make it specific, measurable, and time-bound.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Goal Title *</label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. Master breakout setups"
            className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Description (optional)</label>
          <textarea
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            rows={2}
            placeholder="What does success look like?"
            className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Measure progress by</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'amount', label: '$ Amount' },
              { id: 'percent', label: '% Return' },
              { id: 'trades', label: '# Trades' },
              { id: 'days', label: '# Days' },
              { id: 'r_multiples', label: 'R Multiple' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setCustomMeasure(m.id as CustomConfig['measureType'])}
                className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                  customMeasure === m.id
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                    : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Target Value</label>
            <input
              type="number"
              value={customTarget}
              onChange={(e) => setCustomTarget(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Deadline (optional)</label>
            <input
              type="date"
              value={customDeadline}
              onChange={(e) => setCustomDeadline(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </div>
    );
  }

  const canProceed = step === 0 ? goalType !== null : true;
  const isLastStep = step === totalSteps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0f1219] border border-[#1a1f2e] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#1a1f2e] shrink-0">
          <div className="flex items-center gap-3">
            {selectedType && (
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center ${selectedType.color}`}>
                <selectedType.icon className={`w-4 h-4 ${selectedType.iconColor}`} />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">New Goal</p>
              <p className="text-sm font-semibold text-white">{selectedType?.title ?? 'Choose Goal Type'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1a1f2e] text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {goalType && (
          <div className="flex gap-1.5 px-6 py-3 border-b border-[#1a1f2e] shrink-0">
            {Array.from({ length: totalSteps + 1 }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all flex-1 ${
                  i <= step ? 'bg-blue-500' : 'bg-[#1a1f2e]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1f2e] shrink-0">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1a1f2e] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {isLastStep ? (
            <button
              onClick={handleCreate}
              disabled={saving || !canProceed}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
            >
              {saving ? 'Creating...' : 'Create Goal'}
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-white font-medium transition-colors"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
