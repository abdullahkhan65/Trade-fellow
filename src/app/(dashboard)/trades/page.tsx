'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import TradeTable from '@/components/TradeTable';
import TradeForm from '@/components/TradeForm';
import ExportButtons from '@/components/ExportButtons';
import { useTradeStore } from '@/store/useTradeStore';

export default function TradesPage() {
  const [showForm, setShowForm] = useState(false);
  const { trades, clearAllTrades } = useTradeStore();

  const handleClear = () => {
    if (confirm('Clear all trades? This cannot be undone.')) {
      clearAllTrades();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trade Journal</h1>
          <p className="text-sm text-gray-500 mt-1">{trades.length} total trades logged</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons />
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] hover:bg-red-900/30 border border-[#2a2f3e] hover:border-red-500/30 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Trade
          </button>
        </div>
      </div>

      {/* Trade Table */}
      <TradeTable />

      {showForm && <TradeForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
