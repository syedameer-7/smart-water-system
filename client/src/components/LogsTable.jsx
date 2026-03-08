import React from 'react';

export default function LogsTable({ logs }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Filtration Logs
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Last {logs.length} events
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 pr-4">Timestamp</th>
              <th className="py-2 pr-4">Turbidity (NTU)</th>
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <td className="py-1 pr-4">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-1 pr-4">{log.turbidity.toFixed(2)}</td>
                <td className="py-1 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      log.action === 'DIVERTED_TO_FILTRATION'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : log.action === 'NORMAL_FLOW'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-4 text-center text-slate-400 dark:text-slate-500"
                >
                  No filtration events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

