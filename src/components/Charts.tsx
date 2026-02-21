'use client';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, LineChart, Line
} from 'recharts';
import { useTradeStore } from '@/store/useTradeStore';
import { buildEquityCurve } from '@/lib/calculations';
import { formatCurrency } from '@/lib/calculations';

const chartTheme = {
  background: 'transparent',
  grid: '#1a1f2e',
  text: '#6b7280',
  tooltipBg: '#0d1117',
  tooltipBorder: '#2a2f3e',
};

const CustomTooltip = ({ active, payload, label, currency = 'USD' }: {
  active?: boolean; payload?: readonly { name: string; value: number; color: string }[]; label?: string; currency?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-400 capitalize">{p.name}:</span>
          <span className="text-white font-medium">
            {typeof p.value === 'number'
              ? p.name.toLowerCase().includes('drawdown') || p.name.toLowerCase().includes('%')
                ? `${p.value.toFixed(2)}%`
                : formatCurrency(p.value, currency)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function EquityCurveChart() {
  const { trades, settings } = useTradeStore();
  const data = buildEquityCurve(trades, settings.startingBalance);

  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
          <p className="text-xs text-gray-500 mt-0.5">Account balance over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" /> Balance</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: chartTheme.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: chartTheme.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip currency={settings.currency} />} />
          <ReferenceLine
            y={settings.startingBalance}
            stroke="#374151"
            strokeDasharray="4 4"
            label={{ value: 'Start', fill: '#6b7280', fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#balanceGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DrawdownChart() {
  const { trades, settings } = useTradeStore();
  const data = buildEquityCurve(trades, settings.startingBalance);

  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Drawdown Over Time</h3>
          <p className="text-xs text-gray-500 mt-0.5">Percentage drawdown from peak</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded" /> Drawdown</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500/50 inline-block rounded border-dashed" /> Max Limit</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: chartTheme.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: chartTheme.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            reversed
          />
          <Tooltip content={(props) => <CustomTooltip active={props.active} payload={props.payload as { name: string; value: number; color: string }[]} label={String(props.label ?? '')} />} />
          <ReferenceLine
            y={settings.maxDrawdownPercent}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{ value: `Max ${settings.maxDrawdownPercent}%`, fill: '#ef4444', fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="drawdown"
            name="Drawdown"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#ddGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#f97316' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PLHistogram() {
  const { trades, settings } = useTradeStore();
  const closedTrades = trades
    .filter((t) => t.status === 'closed' && t.pnl !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t, i) => ({
      index: i + 1,
      pnl: t.pnl ?? 0,
      symbol: t.symbol,
      date: t.date,
    }));

  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Trade P&L Distribution</h3>
          <p className="text-xs text-gray-500 mt-0.5">Individual trade results</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-sm inline-block" /> Win</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-500 rounded-sm inline-block" /> Loss</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={closedTrades} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="symbol"
            tick={{ fill: chartTheme.text, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: chartTheme.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0].value as number;
              return (
                <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-3 shadow-xl">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-sm font-bold ${v >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {v >= 0 ? '+' : ''}{formatCurrency(v, settings.currency)}
                  </p>
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
          <Bar dataKey="pnl" name="P&L" radius={[3, 3, 0, 0]}>
            {closedTrades.map((entry, index) => (
              <Cell key={index} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyPerformanceChart() {
  const { trades, settings } = useTradeStore();

  // Aggregate by month
  const monthlyMap: Record<string, number> = {};
  trades
    .filter((t) => t.status === 'closed' && t.pnl !== null)
    .forEach((t) => {
      const key = t.date.slice(0, 7); // YYYY-MM
      monthlyMap[key] = (monthlyMap[key] ?? 0) + (t.pnl ?? 0);
    });

  const data = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({
      month: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      pnl: parseFloat(pnl.toFixed(2)),
    }));

  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Monthly Performance</h3>
          <p className="text-xs text-gray-500 mt-0.5">P&L aggregated by month</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: chartTheme.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: chartTheme.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0].value as number;
              return (
                <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-3 shadow-xl">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-sm font-bold ${v >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {v >= 0 ? '+' : ''}{formatCurrency(v, settings.currency)}
                  </p>
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
          <Bar dataKey="pnl" name="Monthly P&L" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RMultipleChart() {
  const { trades } = useTradeStore();
  const data = trades
    .filter((t) => t.status === 'closed' && t.rMultiple !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t, i) => ({
      index: i + 1,
      r: t.rMultiple ?? 0,
      symbol: t.symbol,
    }));

  return (
    <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">R Multiple History</h3>
          <p className="text-xs text-gray-500 mt-0.5">Risk/reward per trade</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="symbol"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}R`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0].value as number;
              return (
                <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-3 shadow-xl">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-sm font-bold ${v >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {v >= 0 ? '+' : ''}{v.toFixed(2)}R
                  </p>
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#374151" />
          <ReferenceLine y={1} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
          <Bar dataKey="r" name="R Multiple" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.r >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
