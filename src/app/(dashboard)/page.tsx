'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import RiskDashboard from '@/components/RiskDashboard';
import TradeForm from '@/components/TradeForm';
import ExportButtons from '@/components/ExportButtons';
import EconomicCalendar from '@/components/EconomicCalendar';
import DailyMission from '@/components/DailyMission';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Risk Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} — Live risk monitoring
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Trade
          </button>
        </div>
      </div>

      {/* Daily Mission — goals widget */}
      <DailyMission />

      {/* Risk Dashboard */}
      <RiskDashboard />

      {/* Economic Calendar */}
      <div className="mt-6">
        <EconomicCalendar />
      </div>

      {showForm && <TradeForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
