'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, BarChart3, Settings, FileText,
  Activity, TrendingUp, Shield, Calendar, Calculator, Plug, LogOut, User
} from 'lucide-react';
import clsx from 'clsx';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountStore } from '@/store/useAccountStore';
import { computeMetrics, formatCurrency } from '@/lib/calculations';
import { accountToSettings } from '@/types';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trades', label: 'Trade Journal', icon: BookOpen },
  { href: '/charts', label: 'Analytics', icon: BarChart3 },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
  { href: '/mt5', label: 'MT5 / Import', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/docs', label: 'Guide', icon: FileText },
];

interface SidebarProps {
  user?: SupabaseUser | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { trades } = useTradeStore();
  const { activeAccount } = useAccountStore();

  const settings = activeAccount ? accountToSettings(activeAccount) : {
    accountSize: 100000,
    startingBalance: 100000,
    maxDailyRiskPercent: 5,
    maxDrawdownPercent: 10,
    profitTargetPercent: 10,
    tradingStyle: 'day' as const,
    currency: 'USD',
    trailingDrawdown: false,
  };

  const metrics = computeMetrics(trades, settings);
  const isRisk = metrics.dailyLossPercent >= 80 || metrics.currentDrawdown >= settings.maxDrawdownPercent * 0.8;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-60 shrink-0 bg-[#0a0d14] border-r border-[#1a1f2e] flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1a1f2e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">PropTrader</p>
            <p className="text-xs text-gray-600">Risk Dashboard</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-[#1a1f2e]">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Balance
            </span>
            <span className={clsx('font-semibold', metrics.currentBalance >= settings.startingBalance ? 'text-green-400' : 'text-red-400')}>
              {formatCurrency(metrics.currentBalance, settings.currency).replace('$', '$').slice(0, 10)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Daily Loss
            </span>
            <span className={clsx('font-semibold', metrics.dailyLossPercent >= 80 ? 'text-red-400' : 'text-gray-300')}>
              {metrics.dailyLossPercent.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Drawdown</span>
            <span className={clsx('font-semibold', metrics.currentDrawdown >= settings.maxDrawdownPercent * 0.8 ? 'text-orange-400' : 'text-gray-300')}>
              {metrics.currentDrawdown.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Win Rate</span>
            <span className={clsx('font-semibold', metrics.winRate >= 50 ? 'text-green-400' : 'text-red-400')}>
              {metrics.winRate.toFixed(0)}%
            </span>
          </div>
        </div>

        {isRisk && (
          <div className="mt-3 px-2.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400 font-medium">⚠ Risk Alert Active</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-gray-500 hover:text-white hover:bg-[#1a1f2e]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Signout */}
      <div className="px-3 py-4 border-t border-[#1a1f2e] space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user.user_metadata?.full_name ?? user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
