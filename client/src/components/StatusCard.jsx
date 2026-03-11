import React from 'react';

export default function StatusCard({ title, value, subtitle, color = 'bg-white', danger = false }) {

  const isBad =
    danger ||
    value === 'CLOSED' ||
    value === 'IDLE';

  const borderStyle = danger
    ? 'border-red-500 ring-2 ring-red-400/60'
    : 'border-slate-200 dark:border-slate-700';

  return (
    <div
      className={`${color} ${borderStyle} border rounded-xl p-4 shadow-sm flex flex-col gap-1`}
    >
      {/* TITLE */}
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </div>

      {/* VALUE */}
      <div
        style={{
          color: isBad ? '#ef4444' : '#22c55e'
        }}
        className="text-2xl font-bold"
      >
        {value}
      </div>

      {/* SUBTITLE */}
      {subtitle && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </div>
      )}
    </div>
  );
}