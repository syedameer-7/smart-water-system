import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function buildChartData(readings, title) {
  const labels = readings.map((r) => new Date(r.timestamp).toLocaleTimeString());
  const turbidityValues = readings.map((r) => r.turbidity);
  const filtrationMarkers = readings.map((r) =>
    r.filtration_active ? r.turbidity : null
  );

  return {
    labels,
    datasets: [
      {
        label: 'Turbidity (NTU)',
        data: turbidityValues,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.2)',
        tension: 0.3,
        pointRadius: 2
      },
      {
        label: 'Filtration Active',
        data: filtrationMarkers,
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        pointRadius: 4,
        showLine: false
      }
    ]
  };
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    y: {
      title: {
        display: true,
        text: 'NTU'
      }
    }
  }
};

export default function ChartsPanel({ hourly, daily }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm h-80">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Hourly Turbidity
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Last 60 minutes
          </span>
        </div>
        <Line data={buildChartData(hourly, 'Hourly Turbidity')} options={options} />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm h-80">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Daily Turbidity
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Last 24 hours
          </span>
        </div>
        <Line data={buildChartData(daily, 'Daily Turbidity')} options={options} />
      </div>
    </div>
  );
}

