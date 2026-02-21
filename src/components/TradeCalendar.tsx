'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, isToday, isSameMonth } from 'date-fns';
import { Trade } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import clsx from 'clsx';

interface DayData {
  date: Date;
  trades: Trade[];
  pnl: number;
  tradeCount: number;
}

function getDayColor(pnl: number, maxAbs: number): string {
  if (pnl === 0 || maxAbs === 0) return 'bg-[#1a1f2e] border-[#2a2f3e]';
  const intensity = Math.min(1, Math.abs(pnl) / maxAbs);
  if (pnl > 0) {
    if (intensity > 0.75) return 'bg-green-500/70 border-green-500/50';
    if (intensity > 0.4) return 'bg-green-500/40 border-green-500/30';
    return 'bg-green-500/20 border-green-500/20';
  } else {
    if (intensity > 0.75) return 'bg-red-500/70 border-red-500/50';
    if (intensity > 0.4) return 'bg-red-500/40 border-red-500/30';
    return 'bg-red-500/20 border-red-500/20';
  }
}

interface TradeCalendarProps {
  trades: Trade[];
  currency?: string;
}

export default function TradeCalendar({ trades, currency = 'USD' }: TradeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart); // 0=Sun

  // Build day map
  const dayMap = new Map<string, DayData>();
  const closedTrades = trades.filter((t) => t.status === 'closed' && t.pnl !== null);

  for (const trade of closedTrades) {
    try {
      const d = parseISO(trade.date);
      const key = format(d, 'yyyy-MM-dd');
      if (!dayMap.has(key)) {
        dayMap.set(key, { date: d, trades: [], pnl: 0, tradeCount: 0 });
      }
      const entry = dayMap.get(key)!;
      entry.trades.push(trade);
      entry.pnl += trade.pnl ?? 0;
      entry.tradeCount++;
    } catch { /* skip */ }
  }

  const allPnLs = Array.from(dayMap.values()).map((d) => Math.abs(d.pnl));
  const maxAbs = allPnLs.length > 0 ? Math.max(...allPnLs) : 1;

  // Month summary
  const monthTrades = Array.from(dayMap.values()).filter((d) => isSameMonth(d.date, currentDate));
  const monthPnL = monthTrades.reduce((sum, d) => sum + d.pnl, 0);
  const greenDays = monthTrades.filter((d) => d.pnl > 0).length;
  const redDays = monthTrades.filter((d) => d.pnl < 0).length;

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#2a2f3e]">
        <div>
          <h3 className="text-sm font-semibold text-white">{format(currentDate, 'MMMM yyyy')}</h3>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>Total: <span className={clsx('font-medium', monthPnL >= 0 ? 'text-green-400' : 'text-red-400')}>{formatCurrency(monthPnL, currency)}</span></span>
            <span className="text-green-400">▲ {greenDays} days</span>
            <span className="text-red-400">▼ {redDays} days</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-[#1a1f2e] hover:bg-[#2a2f3e] border border-[#2a2f3e] flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 h-8 rounded-lg bg-[#1a1f2e] hover:bg-[#2a2f3e] border border-[#2a2f3e] text-xs text-gray-400 transition-colors">
            Today
          </button>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-[#1a1f2e] hover:bg-[#2a2f3e] border border-[#2a2f3e] flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-600 py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Offset empty cells */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const data = dayMap.get(key);
            const colorClass = data ? getDayColor(data.pnl, maxAbs) : 'bg-[#0d1117] border-[#1a1f2e]';
            const today = isToday(day);

            return (
              <button
                key={key}
                onClick={() => data && setSelectedDay(data)}
                className={clsx(
                  'aspect-square rounded-lg border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 relative',
                  colorClass,
                  data ? 'cursor-pointer hover:scale-105 hover:border-white/20' : 'cursor-default',
                  today && 'ring-1 ring-blue-500'
                )}
              >
                <span className={clsx('text-xs font-bold', today ? 'text-blue-400' : data ? (data.pnl >= 0 ? 'text-white' : 'text-white') : 'text-gray-700')}>
                  {format(day, 'd')}
                </span>
                {data && (
                  <span className={clsx('text-xs leading-none', data.pnl >= 0 ? 'text-green-300' : 'text-red-300')}>
                    {data.pnl >= 0 ? '+' : ''}{data.pnl >= 1000 || data.pnl <= -1000 ? `${(data.pnl / 1000).toFixed(1)}k` : data.pnl.toFixed(0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 flex items-center gap-4 text-xs text-gray-600">
        <span>Less</span>
        {['bg-green-500/20', 'bg-green-500/40', 'bg-green-500/70'].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span className="text-green-400">Profit</span>
        <span className="mx-1 text-gray-700">|</span>
        {['bg-red-500/20', 'bg-red-500/40', 'bg-red-500/70'].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span className="text-red-400">Loss</span>
        <span>More</span>
      </div>

      {/* Day detail popover */}
      {selectedDay && (
        <div className="border-t border-[#2a2f3e] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">{format(selectedDay.date, 'EEEE, MMMM d, yyyy')}</p>
              <p className={clsx('text-xs font-bold mt-0.5', selectedDay.pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                {selectedDay.pnl >= 0 ? '+' : ''}{formatCurrency(selectedDay.pnl, currency)} ({selectedDay.tradeCount} trade{selectedDay.tradeCount !== 1 ? 's' : ''})
              </p>
            </div>
            <button onClick={() => setSelectedDay(null)} className="w-7 h-7 rounded-lg bg-[#1a1f2e] flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <div className="space-y-1.5">
            {selectedDay.trades.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-[#1a1f2e] rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <span className={clsx('font-medium', t.direction === 'long' ? 'text-green-400' : 'text-red-400')}>
                    {t.direction === 'long' ? '↑' : '↓'}
                  </span>
                  <span className="text-white font-semibold">{t.symbol}</span>
                  <span className="text-gray-500">{t.tradingStyle}</span>
                </div>
                <div className="flex items-center gap-3">
                  {t.rMultiple !== null && (
                    <span className={clsx('text-xs', t.rMultiple >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {t.rMultiple >= 0 ? '+' : ''}{t.rMultiple.toFixed(2)}R
                    </span>
                  )}
                  <span className={clsx('font-semibold', (t.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {(t.pnl ?? 0) >= 0 ? '+' : ''}{formatCurrency(t.pnl ?? 0, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
