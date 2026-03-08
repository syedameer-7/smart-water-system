import React, { useState } from 'react';

export default function ControlPanel({ onCommand, isBusy }) {
  const [message, setMessage] = useState('');

  const send = async (target, action, label) => {
    setMessage('');
    try {
      await onCommand(target, action);
      setMessage(`Sent: ${label}`);
    } catch (e) {
      setMessage('Error sending command');
    }
  };

  const buttonClass =
    'px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Manual Control
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Commands are simulated to Arduino/ESP
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={isBusy}
          onClick={() => send('main', 'open', 'Open Main Valve')}
        >
          Open Main Valve
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={isBusy}
          onClick={() => send('main', 'close', 'Close Main Valve')}
        >
          Close Main Valve
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={isBusy}
          onClick={() => send('diversion', 'open', 'Open Diversion Valve')}
        >
          Open Diversion Valve
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={isBusy}
          onClick={() => send('diversion', 'close', 'Close Diversion Valve')}
        >
          Close Diversion Valve
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={isBusy}
          onClick={() => send('pump', 'open', 'Turn Pump ON')}
        >
          Pump ON
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={isBusy}
          onClick={() => send('pump', 'close', 'Turn Pump OFF')}
        >
          Pump OFF
        </button>
      </div>
      {message && (
        <div className="text-xs text-slate-500 dark:text-slate-400">{message}</div>
      )}
    </div>
  );
}

