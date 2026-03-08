import React from 'react';

export default function SystemStatus({ status }) {
  const {
    sensorStatus,
    connectionStatus,
    lastDataReceived,
    pumpStatus,
    mainValveStatus,
    diversionValveStatus
  } = status || {};

  const itemClass = 'flex justify-between text-xs py-1';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        System Status
      </h3>
      <div className={itemClass}>
        <span className="text-slate-500 dark:text-slate-400">Sensor</span>
        <span
          className={
            sensorStatus === 'OK'
              ? 'text-emerald-500'
              : sensorStatus === 'NO_DATA'
              ? 'text-slate-400'
              : 'text-amber-500'
          }
        >
          {sensorStatus || 'UNKNOWN'}
        </span>
      </div>
      <div className={itemClass}>
        <span className="text-slate-500 dark:text-slate-400">Connection</span>
        <span
          className={
            connectionStatus === 'ONLINE' ? 'text-emerald-500' : 'text-red-500'
          }
        >
          {connectionStatus || 'OFFLINE'}
        </span>
      </div>
      <div className={itemClass}>
        <span className="text-slate-500 dark:text-slate-400">
          Last Data Received
        </span>
        <span className="text-slate-300 dark:text-slate-500 max-w-[55%] text-right">
          {lastDataReceived
            ? new Date(lastDataReceived).toLocaleString()
            : 'No data yet'}
        </span>
      </div>
      <div className={itemClass}>
        <span className="text-slate-500 dark:text-slate-400">Pump</span>
        <span
          className={
            pumpStatus === 'ON' ? 'text-emerald-500 font-semibold' : 'text-slate-400'
          }
        >
          {pumpStatus || 'OFF'}
        </span>
      </div>
      <div className={itemClass}>
        <span className="text-slate-500 dark:text-slate-400">Main Valve</span>
        <span
          className={
            mainValveStatus === 'OPEN'
              ? 'text-emerald-500 font-semibold'
              : 'text-slate-400'
          }
        >
          {mainValveStatus || 'CLOSED'}
        </span>
      </div>
      <div className={itemClass}>
        <span className="text-slate-500 dark:text-slate-400">Diversion Valve</span>
        <span
          className={
            diversionValveStatus === 'OPEN'
              ? 'text-amber-500 font-semibold'
              : 'text-slate-400'
          }
        >
          {diversionValveStatus || 'CLOSED'}
        </span>
      </div>
    </div>
  );
}

