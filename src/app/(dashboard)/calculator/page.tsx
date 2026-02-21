'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Target, Info } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { accountToSettings } from '@/types';
import clsx from 'clsx';

type CalcMode = 'fixed-risk' | 'fixed-lots';

const INSTRUMENTS: Record<string, { pipValue: number; label: string; type: string }> = {
  'EUR/USD': { pipValue: 10, label: 'EUR/USD', type: 'forex' },
  'GBP/USD': { pipValue: 10, label: 'GBP/USD', type: 'forex' },
  'USD/JPY': { pipValue: 9.1, label: 'USD/JPY', type: 'forex' },
  'GBP/JPY': { pipValue: 9.1, label: 'GBP/JPY', type: 'forex' },
  'AUD/USD': { pipValue: 10, label: 'AUD/USD', type: 'forex' },
  'USD/CAD': { pipValue: 7.7, label: 'USD/CAD', type: 'forex' },
  'EUR/GBP': { pipValue: 12.5, label: 'EUR/GBP', type: 'forex' },
  'XAU/USD': { pipValue: 10, label: 'XAU/USD (Gold)', type: 'commodity' },
  'NAS100': { pipValue: 1, label: 'NAS100', type: 'index' },
  'SP500': { pipValue: 1, label: 'SP500', type: 'index' },
  'BTC/USD': { pipValue: 1, label: 'BTC/USD', type: 'crypto' },
  'Custom': { pipValue: 10, label: 'Custom', type: 'custom' },
};

export default function CalculatorPage() {
  const { activeAccount } = useAccountStore();
  const settings = activeAccount ? accountToSettings(activeAccount) : null;

  const [mode, setMode] = useState<CalcMode>('fixed-risk');
  const [instrument, setInstrument] = useState('EUR/USD');
  const [customPipValue, setCustomPipValue] = useState('10');
  const [accountBalance, setAccountBalance] = useState(settings?.startingBalance?.toString() ?? '100000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [riskDollar, setRiskDollar] = useState('');
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [fixedLots, setFixedLots] = useState('0.1');

  const balance = parseFloat(accountBalance) || 0;
  const entryPrice = parseFloat(entry) || 0;
  const slPrice = parseFloat(stopLoss) || 0;
  const tpPrice = parseFloat(takeProfit) || 0;
  const pipVal = instrument === 'Custom' ? (parseFloat(customPipValue) || 10) : INSTRUMENTS[instrument].pipValue;

  // Calculate pip distance
  const pipDistance = entryPrice && slPrice
    ? Math.abs(entryPrice - slPrice)
    : 0;

  const tpDistance = entryPrice && tpPrice
    ? (direction === 'long' ? tpPrice - entryPrice : entryPrice - tpPrice)
    : 0;

  const rrRatio = pipDistance > 0 && tpDistance > 0 ? tpDistance / pipDistance : null;

  // Mode: fixed risk → calculate lots
  let calculatedLots = 0;
  let riskAmount = 0;
  let tpAmount = 0;

  if (mode === 'fixed-risk') {
    const riskPct = parseFloat(riskPercent) || 0;
    const riskD = parseFloat(riskDollar) || (balance * riskPct / 100);
    riskAmount = riskD;

    if (pipDistance > 0 && pipVal > 0) {
      // For standard lots: Risk = Lots × pip_distance × pip_value_per_lot
      calculatedLots = riskAmount / (pipDistance * pipVal);
    }

    if (tpDistance > 0 && calculatedLots > 0) {
      tpAmount = calculatedLots * tpDistance * pipVal;
    }
  } else {
    // Mode: fixed lots → calculate risk
    const lots = parseFloat(fixedLots) || 0;
    riskAmount = lots * pipDistance * pipVal;
    calculatedLots = lots;
    if (tpDistance > 0) {
      tpAmount = lots * tpDistance * pipVal;
    }
  }

  const riskPctOfBalance = balance > 0 ? (riskAmount / balance) * 100 : 0;
  const inClass = 'w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white tracking-tight">Position Size Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">Calculate your exact lot size based on risk parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-5">
          {/* Mode Toggle */}
          <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Calculation Mode</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('fixed-risk')}
                className={clsx('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all', mode === 'fixed-risk' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400')}
              >
                Risk → Lots
              </button>
              <button
                onClick={() => setMode('fixed-lots')}
                className={clsx('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all', mode === 'fixed-lots' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400')}
              >
                Lots → Risk
              </button>
            </div>
          </div>

          {/* Instrument + Account */}
          <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Setup</p>

            <div>
              <label className={labelCls}>Instrument</label>
              <select value={instrument} onChange={(e) => setInstrument(e.target.value)} className={inClass}>
                {Object.entries(INSTRUMENTS).map(([key, { label, type }]) => (
                  <option key={key} value={key}>{label} ({type})</option>
                ))}
              </select>
            </div>

            {instrument === 'Custom' && (
              <div>
                <label className={labelCls}>Pip Value per Lot ($)</label>
                <input type="number" value={customPipValue} onChange={(e) => setCustomPipValue(e.target.value)} className={inClass} placeholder="10" />
              </div>
            )}

            <div>
              <label className={labelCls}>Account Balance ($)</label>
              <input type="number" value={accountBalance} onChange={(e) => setAccountBalance(e.target.value)} className={inClass} placeholder="100000" />
            </div>

            {/* Direction */}
            <div>
              <label className={labelCls}>Direction</label>
              <div className="flex gap-2">
                <button onClick={() => setDirection('long')} className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all', direction === 'long' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400')}>
                  <TrendingUp className="w-3.5 h-3.5" /> Long
                </button>
                <button onClick={() => setDirection('short')} className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all', direction === 'short' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400')}>
                  <TrendingDown className="w-3.5 h-3.5" /> Short
                </button>
              </div>
            </div>
          </div>

          {/* Trade Prices */}
          <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trade Prices</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Entry</label>
                <input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="1.0800" className={inClass} />
              </div>
              <div>
                <label className={labelCls}>Stop Loss</label>
                <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="1.0780" className={inClass} />
              </div>
              <div>
                <label className={labelCls}>Take Profit</label>
                <input type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="1.0860" className={inClass} />
              </div>
            </div>
          </div>

          {/* Risk Input */}
          <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {mode === 'fixed-risk' ? 'Risk Amount' : 'Position Size'}
            </p>
            {mode === 'fixed-risk' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Risk %</label>
                  <div className="relative">
                    <input type="number" value={riskPercent} onChange={(e) => { setRiskPercent(e.target.value); setRiskDollar(''); }} step="0.1" min="0" max="100" className={`${inClass} pr-7`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Risk $ (override)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input type="number" value={riskDollar} onChange={(e) => { setRiskDollar(e.target.value); setRiskPercent(''); }} placeholder={`${(balance * 0.01).toFixed(0)}`} className={`${inClass} pl-7`} />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className={labelCls}>Lot Size</label>
                <input type="number" value={fixedLots} onChange={(e) => setFixedLots(e.target.value)} step="0.01" min="0" className={inClass} placeholder="0.10" />
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* Main Result */}
          <div className={clsx('rounded-xl p-6 border', mode === 'fixed-risk' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-purple-500/10 border-purple-500/30')}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {mode === 'fixed-risk' ? 'Recommended Position Size' : 'Risk Calculation'}
            </p>

            <div className="text-center py-4">
              <p className="text-5xl font-bold text-white mb-2">
                {calculatedLots > 0 ? calculatedLots.toFixed(2) : '—'}
              </p>
              <p className="text-sm text-gray-400">{mode === 'fixed-risk' ? 'Lots / Units' : 'Lots entered'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-black/30 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Risk Amount</p>
                <p className={clsx('text-base font-bold', riskPctOfBalance > (settings?.maxDailyRiskPercent ?? 5) ? 'text-red-400' : 'text-orange-400')}>
                  ${riskAmount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{riskPctOfBalance.toFixed(2)}% of balance</p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Potential Profit</p>
                <p className="text-base font-bold text-green-400">
                  {tpAmount > 0 ? `$${tpAmount.toFixed(2)}` : '—'}
                </p>
                {rrRatio && <p className="text-xs text-gray-600 mt-0.5">R:R {rrRatio.toFixed(2)}</p>}
              </div>
            </div>

            {riskPctOfBalance > (settings?.maxDailyRiskPercent ?? 5) && (
              <div className="mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">Exceeds your daily risk limit ({settings?.maxDailyRiskPercent ?? 5}%)</p>
              </div>
            )}
          </div>

          {/* Breakdown */}
          {pipDistance > 0 && (
            <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Breakdown</p>
              <div className="space-y-3">
                {[
                  { label: 'Instrument', value: INSTRUMENTS[instrument]?.label ?? instrument },
                  { label: 'Direction', value: direction.toUpperCase(), color: direction === 'long' ? 'text-green-400' : 'text-red-400' },
                  { label: 'Pip Distance (SL)', value: pipDistance.toFixed(5) },
                  { label: 'Pip Value per Lot', value: `$${pipVal.toFixed(2)}` },
                  { label: 'Position Size', value: calculatedLots > 0 ? `${calculatedLots.toFixed(2)} lots` : '—' },
                  { label: 'Risk Amount', value: `$${riskAmount.toFixed(2)}`, color: 'text-red-400' },
                  { label: 'Risk % of Balance', value: `${riskPctOfBalance.toFixed(2)}%`, color: riskPctOfBalance > 3 ? 'text-red-400' : 'text-yellow-400' },
                  ...(tpDistance > 0 ? [
                    { label: 'TP Distance', value: tpDistance.toFixed(5) },
                    { label: 'Potential Profit', value: `$${tpAmount.toFixed(2)}`, color: 'text-green-400' },
                    { label: 'Risk:Reward', value: rrRatio ? `1:${rrRatio.toFixed(2)}` : '—', color: (rrRatio ?? 0) >= 1.5 ? 'text-green-400' : 'text-yellow-400' },
                  ] : []),
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={clsx('font-medium', color ?? 'text-white')}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick presets */}
          <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Risk Presets</p>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1, 1.5, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => { setMode('fixed-risk'); setRiskPercent(r.toString()); setRiskDollar(''); }}
                  className={clsx('py-2 rounded-xl text-xs font-medium border transition-all', parseFloat(riskPercent) === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400 hover:text-white')}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
