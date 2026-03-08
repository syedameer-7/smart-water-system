import React, { useEffect, useMemo, useState } from 'react';
import StatusCard from './components/StatusCard';
import ChartsPanel from './components/ChartsPanel';
import ControlPanel from './components/ControlPanel';
import LogsTable from './components/LogsTable';
import SystemStatus from './components/SystemStatus';
import {
  fetchCurrentStatus,
  fetchFiltrationLogs,
  fetchHistory,
  fetchSystemStatus,
  fetchThreshold,
  sendValveCommand,
  updateThreshold
} from './services/api';

const POLL_INTERVAL_MS = 4000;

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? true
      : false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return [dark, setDark];
}

export default function App() {
  const [dark, setDark] = useDarkMode();
  const [activePage, setActivePage] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [threshold, setThresholdState] = useState(null);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [busyCommand, setBusyCommand] = useState(false);

  const exceededThreshold = useMemo(() => {
    if (!status || threshold == null) return false;
    return status.turbidity != null && status.turbidity > threshold;
  }, [status, threshold]);

  useEffect(() => {
    async function initialLoad() {
      try {
        const [st, h, d, l, sys, th] = await Promise.all([
          fetchCurrentStatus(),
          fetchHistory('hour'),
          fetchHistory('day'),
          fetchFiltrationLogs(),
          fetchSystemStatus(),
          fetchThreshold()
        ]);
        setStatus(st);
        setHourly(h.readings || []);
        setDaily(d.readings || []);
        setLogs(l);
        setSystemStatus(sys);
        setThresholdState(th.threshold);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Initial load failed', e);
      }
    }
    initialLoad();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [st, h, l, sys] = await Promise.all([
          fetchCurrentStatus(),
          fetchHistory('hour'),
          fetchFiltrationLogs(),
          fetchSystemStatus()
        ]);
        setStatus(st);
        setHourly(h.readings || []);
        setLogs(l);
        setSystemStatus(sys);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Polling failed', e);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const exportCsv = () => {
    const rows = [['timestamp', 'turbidity', 'quality', 'main_valve', 'diversion_valve', 'filtration_active', 'pump_status']];
    daily.forEach((r) => {
      rows.push([
        r.timestamp,
        r.turbidity,
        r.quality_status,
        r.main_valve_status,
        r.diversion_valve_status,
        r.filtration_active ? '1' : '0',
        r.pump_status
      ]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'water_turbidity_daily.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleThresholdSave = async () => {
    if (threshold == null) return;
    setSavingThreshold(true);
    try {
      const updated = await updateThreshold(Number(threshold));
      setThresholdState(updated.threshold);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to update threshold', e);
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleCommand = async (target, action) => {
    setBusyCommand(true);
    try {
      await sendValveCommand(target, action);
      const [st, sys, l] = await Promise.all([
        fetchCurrentStatus(),
        fetchSystemStatus(),
        fetchFiltrationLogs()
      ]);
      setStatus(st);
      setSystemStatus(sys);
      setLogs(l);
    } finally {
      setBusyCommand(false);
    }
  };

  const qualityLabel =
    status?.qualityStatus === 'IMPURE'
      ? 'Impure Water'
      : status?.qualityStatus === 'CLEAN'
      ? 'Clean Water'
      : 'Unknown';

  return (
    <div className="min-h-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              Smart Water Quality Monitoring
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Turbidity-driven control of main and diversion valves
            </p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex gap-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-full p-1">
              <button
                type="button"
                onClick={() => setActivePage('dashboard')}
                className={`px-3 py-1.5 rounded-full ${
                  activePage === 'dashboard'
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActivePage('system')}
                className={`px-3 py-1.5 rounded-full ${
                  activePage === 'system'
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                System Status
              </button>
            </nav>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 text-xs"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {activePage === 'dashboard' && (
          <>
            {exceededThreshold && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
                <div className="font-semibold">
                  WATER QUALITY EXCEEDED SAFE LIMIT
                </div>
                <div className="text-[11px]">
                  Turbidity: {status?.turbidity?.toFixed(2)} NTU &nbsp;|&nbsp;
                  Threshold: {threshold}
                </div>
              </div>
            )}

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatusCard
                title="Live Turbidity"
                value={
                  status?.turbidity != null
                    ? `${status.turbidity.toFixed(2)} NTU`
                    : 'No data'
                }
                subtitle={qualityLabel}
                danger={exceededThreshold}
              />
              <StatusCard
                title="Main Valve"
                value={status?.mainValveStatus || 'CLOSED'}
                subtitle={
                  status?.mainValveStatus === 'OPEN'
                    ? 'Normal pipeline flow'
                    : 'Closed due to quality or manual control'
                }
              />
              <StatusCard
                title="Diversion Valve"
                value={status?.diversionValveStatus || 'CLOSED'}
                subtitle={
                  status?.diversionValveStatus === 'OPEN'
                    ? 'Diverting to filtration'
                    : 'Inactive'
                }
              />
              <StatusCard
                title="Filtration"
                value={status?.filtrationActive ? 'ACTIVE' : 'IDLE'}
                subtitle={
                  status?.filtrationActive
                    ? 'Impure water being filtered'
                    : 'No diversion required'
                }
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartsPanel hourly={hourly} daily={daily} />
              </div>
              <div className="flex flex-col gap-4">
                <ControlPanel onCommand={handleCommand} isBusy={busyCommand} />
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Threshold Configuration
                  </h3>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Turbidity Threshold (NTU)
                    <input
                      type="number"
                      step="0.1"
                      value={threshold ?? ''}
                      onChange={(e) => setThresholdState(e.target.value)}
                      className="mt-1 w-full px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleThresholdSave}
                    disabled={savingThreshold}
                    className="mt-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {savingThreshold ? 'Saving...' : 'Save Threshold'}
                  </button>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="mt-2 inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700"
                  >
                    Export Daily Data as CSV
                  </button>
                </div>
              </div>
            </section>

            <section>
              <LogsTable logs={logs} />
            </section>
          </>
        )}

        {activePage === 'system' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SystemStatus status={systemStatus || {}} />
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This page summarizes the health of the turbidity sensor,
                connection to the Arduino/ESP controller, and the current
                actuation state of the main and diversion valves. Use it to
                quickly verify that data is flowing and that the pump and valves
                are behaving as expected.
              </p>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <span className="font-semibold">Backend API:</span> assumed at{' '}
                  <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">
                    http://localhost:4000
                  </code>
                </div>
                <div>
                  <span className="font-semibold">Frontend dev server:</span> via{' '}
                  <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">
                    npm run dev
                  </code>{' '}
                  in the <code>client</code> folder.
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

