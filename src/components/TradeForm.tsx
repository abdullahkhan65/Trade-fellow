'use client';

import { useState } from 'react';
import { X, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { TradeDirection, TradingStyle } from '@/types';
import { calculateRisk, calculatePnL, calculateRMultiple } from '@/lib/calculations';
import { format } from 'date-fns';

interface TradeFormProps {
  onClose: () => void;
  editTrade?: {
    id: string;
    date: string;
    symbol: string;
    direction: TradeDirection;
    positionSize: number;
    entry: number;
    stopLoss: number;
    takeProfit: number | null;
    exit: number | null;
    status: 'open' | 'closed';
    tradingStyle: TradingStyle;
    notes: string;
    tags: string[];
  };
}

export default function TradeForm({ onClose, editTrade }: TradeFormProps) {
  const { addTrade, updateTrade, settings } = useTradeStore();

  const [form, setForm] = useState({
    date: editTrade?.date ?? format(new Date(), 'yyyy-MM-dd'),
    symbol: editTrade?.symbol ?? '',
    direction: (editTrade?.direction ?? 'long') as TradeDirection,
    positionSize: editTrade?.positionSize?.toString() ?? '',
    entry: editTrade?.entry?.toString() ?? '',
    stopLoss: editTrade?.stopLoss?.toString() ?? '',
    takeProfit: editTrade?.takeProfit?.toString() ?? '',
    exit: editTrade?.exit?.toString() ?? '',
    status: (editTrade?.status ?? 'closed') as 'open' | 'closed',
    tradingStyle: (editTrade?.tradingStyle ?? settings.tradingStyle) as TradingStyle,
    notes: editTrade?.notes ?? '',
    tags: editTrade?.tags?.join(', ') ?? '',
  });

  const entry = parseFloat(form.entry) || 0;
  const stopLoss = parseFloat(form.stopLoss) || 0;
  const positionSize = parseFloat(form.positionSize) || 0;
  const exitPrice = parseFloat(form.exit) || 0;

  const { riskAmount, riskPercent } = entry && stopLoss && positionSize
    ? calculateRisk(entry, stopLoss, positionSize, settings.startingBalance, form.direction)
    : { riskAmount: 0, riskPercent: 0 };

  const previewPnL = entry && exitPrice && positionSize
    ? calculatePnL(entry, exitPrice, positionSize, form.direction)
    : null;

  const previewRR = entry && exitPrice && stopLoss
    ? calculateRMultiple(entry, exitPrice, stopLoss, form.direction)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tradeData = {
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      positionSize: parseFloat(form.positionSize),
      entry: parseFloat(form.entry),
      stopLoss: parseFloat(form.stopLoss),
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : null,
      exit: form.status === 'closed' && form.exit ? parseFloat(form.exit) : null,
      status: form.status,
      tradingStyle: form.tradingStyle,
      notes: form.notes,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    if (editTrade) {
      updateTrade(editTrade.id, tradeData);
    } else {
      addTrade(tradeData);
    }
    onClose();
  };

  const inputClass =
    'w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2f3e]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {editTrade ? 'Edit Trade' : 'Log New Trade'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a1f2e] flex items-center justify-center hover:bg-[#2a2f3e] transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Date + Symbol + Direction */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Symbol</label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="EUR/USD"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Direction</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, direction: 'long' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.direction === 'long'
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Long
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, direction: 'short' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.direction === 'short'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#1a1f2e] border-[#2a2f3e] text-gray-400'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Short
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Entry + SL + TP */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Entry Price</label>
              <input
                type="number"
                step="any"
                value={form.entry}
                onChange={(e) => setForm({ ...form, entry: e.target.value })}
                placeholder="0.00"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Stop Loss</label>
              <input
                type="number"
                step="any"
                value={form.stopLoss}
                onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
                placeholder="0.00"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Take Profit</label>
              <input
                type="number"
                step="any"
                value={form.takeProfit}
                onChange={(e) => setForm({ ...form, takeProfit: e.target.value })}
                placeholder="0.00 (optional)"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 3: Position Size + Exit + Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Position Size</label>
              <input
                type="number"
                step="any"
                value={form.positionSize}
                onChange={(e) => setForm({ ...form, positionSize: e.target.value })}
                placeholder="0"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Exit Price</label>
              <input
                type="number"
                step="any"
                value={form.exit}
                onChange={(e) => setForm({ ...form, exit: e.target.value })}
                placeholder="0.00"
                className={inputClass}
                disabled={form.status === 'open'}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'open' | 'closed' })}
                className={inputClass}
              >
                <option value="closed">Closed</option>
                <option value="open">Open</option>
              </select>
            </div>
          </div>

          {/* Row 4: Trading Style + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Trading Style</label>
              <select
                value={form.tradingStyle}
                onChange={(e) => setForm({ ...form, tradingStyle: e.target.value as TradingStyle })}
                className={inputClass}
              >
                <option value="scalping">Scalping</option>
                <option value="day">Day Trading</option>
                <option value="swing">Swing Trading</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="breakout, trend, london-session"
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Trade rationale, entry reason, lessons learned..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Live Calculation Preview */}
          {(riskAmount > 0 || previewPnL !== null) && (
            <div className="bg-[#1a1f2e] rounded-xl p-4 border border-[#2a2f3e]">
              <p className="text-xs font-medium text-gray-400 mb-3">Live Calculation Preview</p>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Risk Amount</p>
                  <p className="text-sm font-semibold text-orange-400">
                    ${riskAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk %</p>
                  <p className={`text-sm font-semibold ${riskPercent > settings.maxDailyRiskPercent ? 'text-red-400' : 'text-yellow-400'}`}>
                    {riskPercent.toFixed(2)}%
                  </p>
                </div>
                {previewPnL !== null && (
                  <div>
                    <p className="text-xs text-gray-500">Est. P&L</p>
                    <p className={`text-sm font-semibold ${previewPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {previewPnL >= 0 ? '+' : ''}{previewPnL.toFixed(2)}
                    </p>
                  </div>
                )}
                {previewRR !== null && (
                  <div>
                    <p className="text-xs text-gray-500">R Multiple</p>
                    <p className={`text-sm font-semibold ${previewRR >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {previewRR >= 0 ? '+' : ''}{previewRR.toFixed(2)}R
                    </p>
                  </div>
                )}
              </div>
              {riskPercent > settings.maxDailyRiskPercent && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  ⚠ Risk exceeds your max daily risk limit ({settings.maxDailyRiskPercent}%)
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#1a1f2e] border border-[#2a2f3e] text-gray-400 text-sm font-medium hover:bg-[#2a2f3e] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              {editTrade ? 'Update Trade' : 'Log Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
