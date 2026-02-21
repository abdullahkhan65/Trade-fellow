'use client';

import { useState } from 'react';
import { Trash2, Edit2, CheckCircle, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { Trade } from '@/types';
import { format, parseISO } from 'date-fns';
import TradeForm from './TradeForm';
import clsx from 'clsx';

type SortKey = 'date' | 'symbol' | 'pnl' | 'riskPercent' | 'rMultiple';
type SortDir = 'asc' | 'desc';

export default function TradeTable() {
  const { trades, deleteTrade, closeTrade } = useTradeStore();
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [closeId, setCloseId] = useState<string | null>(null);
  const [closePrice, setClosePrice] = useState('');

  const filtered = trades
    .filter((t) => {
      const q = search.toLowerCase();
      return (
        (statusFilter === 'all' || t.status === statusFilter) &&
        (t.symbol.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    })
    .sort((a, b) => {
      let aVal: number | string, bVal: number | string;
      switch (sortKey) {
        case 'date': aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); break;
        case 'symbol': aVal = a.symbol; bVal = b.symbol; break;
        case 'pnl': aVal = a.pnl ?? -Infinity; bVal = b.pnl ?? -Infinity; break;
        case 'riskPercent': aVal = a.riskPercent; bVal = b.riskPercent; break;
        case 'rMultiple': aVal = a.rMultiple ?? -Infinity; bVal = b.rMultiple ?? -Infinity; break;
        default: aVal = 0; bVal = 0;
      }
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleClosePosition = () => {
    if (closeId && closePrice) {
      closeTrade(closeId, parseFloat(closePrice));
      setCloseId(null);
      setClosePrice('');
    }
  };

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return <ChevronDown className="w-3 h-3 text-gray-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-400" />
      : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  const thClass = 'px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol, notes, tags..."
            className="w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          {(['all', 'open', 'closed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors',
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1f2e] border border-[#2a2f3e] text-gray-400 hover:text-white'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#2a2f3e]">
              <tr>
                <th className={thClass} onClick={() => handleSort('date')}>
                  <span className="flex items-center gap-1">Date <SortIcon field="date" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('symbol')}>
                  <span className="flex items-center gap-1">Symbol <SortIcon field="symbol" /></span>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dir</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit</th>
                <th className={thClass} onClick={() => handleSort('riskPercent')}>
                  <span className="flex items-center gap-1">Risk% <SortIcon field="riskPercent" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('pnl')}>
                  <span className="flex items-center gap-1">P&L <SortIcon field="pnl" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('rMultiple')}>
                  <span className="flex items-center gap-1">R <SortIcon field="rMultiple" /></span>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1f2e]">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-sm text-gray-600">
                    No trades found. Log your first trade!
                  </td>
                </tr>
              )}
              {filtered.map((trade) => (
                <tr key={trade.id} className="hover:bg-[#1a1f2e]/50 transition-colors">
                  <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {format(parseISO(trade.date), 'MMM dd, yy')}
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-white whitespace-nowrap">{trade.symbol}</td>
                  <td className="px-3 py-3">
                    <span className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      trade.direction === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    )}>
                      {trade.direction === 'long' ? '↑ L' : '↓ S'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-300 font-mono">{trade.entry.toFixed(4)}</td>
                  <td className="px-3 py-3 text-xs font-mono">
                    {trade.exit !== null ? (
                      <span className={trade.pnl !== null && trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {trade.exit.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={clsx(
                      'text-xs font-medium',
                      trade.riskPercent > 3 ? 'text-red-400' : trade.riskPercent > 1.5 ? 'text-yellow-400' : 'text-gray-400'
                    )}>
                      {trade.riskPercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap">
                    {trade.pnl !== null ? (
                      <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">open</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs font-medium">
                    {trade.rMultiple !== null ? (
                      <span className={trade.rMultiple >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-500 capitalize">{trade.tradingStyle}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      trade.status === 'open'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    )}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      {trade.status === 'open' && (
                        <button
                          onClick={() => setCloseId(trade.id)}
                          className="w-7 h-7 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 flex items-center justify-center transition-colors"
                          title="Close Position"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditTrade(trade); setShowForm(true); }}
                        className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      <button
                        onClick={() => deleteTrade(trade.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[#2a2f3e] flex items-center justify-between text-xs text-gray-500">
            <span>{filtered.length} trade{filtered.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-4">
              <span>
                Total P&L:{' '}
                <span className={clsx(
                  'font-semibold',
                  filtered.reduce((s, t) => s + (t.pnl ?? 0), 0) >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  ${filtered.reduce((s, t) => s + (t.pnl ?? 0), 0).toFixed(2)}
                </span>
              </span>
              <span>
                Wins: <span className="text-green-400 font-semibold">{filtered.filter((t) => (t.pnl ?? 0) > 0).length}</span>
              </span>
              <span>
                Losses: <span className="text-red-400 font-semibold">{filtered.filter((t) => (t.pnl ?? 0) < 0).length}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Close Position Modal */}
      {closeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Close Position</h3>
            <p className="text-sm text-gray-400 mb-4">Enter the exit price to close this position.</p>
            <input
              type="number"
              step="any"
              value={closePrice}
              onChange={(e) => setClosePrice(e.target.value)}
              placeholder="Exit price"
              className="w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCloseId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1a1f2e] border border-[#2a2f3e] text-gray-400 text-sm hover:bg-[#2a2f3e] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClosePosition}
                disabled={!closePrice}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                Close Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {showForm && editTrade && (
        <TradeForm
          onClose={() => { setShowForm(false); setEditTrade(null); }}
          editTrade={editTrade}
        />
      )}
    </div>
  );
}
