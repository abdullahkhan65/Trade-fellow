'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accent?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'orange';
  progress?: number; // 0-100
  progressColor?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const accentMap = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', value: 'text-green-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', value: 'text-red-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', value: 'text-blue-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: 'text-yellow-400', value: 'text-yellow-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', value: 'text-purple-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'text-orange-400', value: 'text-orange-400' },
};

export default function MetricCard({
  label,
  value,
  subValue,
  icon,
  trend,
  accent = 'blue',
  progress,
  progressColor,
  className,
  size = 'md',
}: MetricCardProps) {
  const colors = accentMap[accent];

  return (
    <div
      className={clsx(
        'relative rounded-xl border bg-[#0d1117] overflow-hidden transition-all hover:border-opacity-60',
        colors.border,
        size === 'sm' ? 'p-3' : size === 'lg' ? 'p-6' : 'p-4',
        className
      )}
    >
      {/* Subtle gradient background */}
      <div className={clsx('absolute inset-0 opacity-30', colors.bg)} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
          {icon && (
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', colors.bg)}>
              <span className={clsx('w-3.5 h-3.5', colors.icon)}>{icon}</span>
            </div>
          )}
        </div>

        <div className={clsx(
          'font-bold tracking-tight',
          size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl',
          colors.value
        )}>
          {value}
        </div>

        {subValue && (
          <p className="text-xs text-gray-500 mt-1">{subValue}</p>
        )}

        {progress !== undefined && (
          <div className="mt-3">
            <div className="w-full bg-[#1a1f2e] rounded-full h-1.5">
              <div
                className={clsx('h-1.5 rounded-full transition-all duration-500', progressColor ?? 'bg-blue-500')}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
