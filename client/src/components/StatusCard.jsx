import React from 'react';

export default function StatusCard({ title, value, subtitle, color = 'bg-white', danger = false }) {
  const dangerClasses = danger
    ? 'border-red-500 text-red-600 dark:text-red-400'
    : 'border-slate-200 dark:border-slate-700';

  return (
    <div
      className={`${color} ${danger ? 'ring-2 ring-red-400/60' : ''} border ${dangerClasses} rounded-xl p-4 shadow-sm flex flex-col gap-1`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && (
        <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
      )}
    </div>
  );
}

