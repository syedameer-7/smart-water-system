require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  getThreshold,
  setThreshold,
  insertReading,
  insertFiltrationLog,
  getLatestReading,
  getReadingsSince,
  getFiltrationLogs,
  DEFAULT_THRESHOLD
} = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const ENABLE_SIMULATOR = process.env.ENABLE_SIMULATOR === 'true';

app.use(cors());
app.use(express.json());

let currentState = {
  turbidity: null,
  qualityStatus: 'UNKNOWN',
  mainValveStatus: 'CLOSED',
  diversionValveStatus: 'CLOSED',
  filtrationActive: false,
  pumpStatus: 'OFF',
  sensorStatus: 'UNKNOWN',
  connectionStatus: 'OFFLINE',
  lastDataReceived: null
};

function computeStatusesFromTurbidity(turbidityValue) {
  const threshold = getThreshold();
  const isImpure = turbidityValue > threshold;
  const qualityStatus = isImpure ? 'IMPURE' : 'CLEAN';

  let mainValveStatus = 'OPEN';
  let diversionValveStatus = 'CLOSED';
  let filtrationActive = false;

  if (isImpure) {
    mainValveStatus = 'CLOSED';
    diversionValveStatus = 'OPEN';
    filtrationActive = true;
  }

  const pumpStatus =
    mainValveStatus === 'OPEN' || diversionValveStatus === 'OPEN'
      ? 'ON'
      : 'OFF';

  return {
    threshold,
    isImpure,
    qualityStatus,
    mainValveStatus,
    diversionValveStatus,
    filtrationActive,
    pumpStatus
  };
}

function updateConnectionStatus() {
  if (!currentState.lastDataReceived) {
    currentState.connectionStatus = 'OFFLINE';
    currentState.sensorStatus = 'NO_DATA';
    return;
  }
  const now = Date.now();
  const last = new Date(currentState.lastDataReceived).getTime();
  const diffSec = (now - last) / 1000;
  currentState.connectionStatus = diffSec <= 15 ? 'ONLINE' : 'OFFLINE';
  currentState.sensorStatus = diffSec <= 60 ? 'OK' : 'STALE';
}

function handleSensorData({ turbidity }) {
  const timestamp = new Date().toISOString();
  const {
    threshold,
    isImpure,
    qualityStatus,
    mainValveStatus,
    diversionValveStatus,
    filtrationActive,
    pumpStatus
  } = computeStatusesFromTurbidity(turbidity);

  insertReading({
    timestamp,
    turbidity,
    quality_status: qualityStatus,
    main_valve_status: mainValveStatus,
    diversion_valve_status: diversionValveStatus,
    filtration_active: filtrationActive,
    pump_status: pumpStatus
  });

  const action = isImpure ? 'DIVERTED_TO_FILTRATION' : 'NORMAL_FLOW';
  insertFiltrationLog({
    timestamp,
    turbidity,
    action
  });

  currentState = {
    turbidity,
    qualityStatus,
    mainValveStatus,
    diversionValveStatus,
    filtrationActive,
    pumpStatus,
    sensorStatus: 'OK',
    connectionStatus: 'ONLINE',
    lastDataReceived: timestamp,
    threshold
  };

  return {
    ...currentState,
    action
  };
}

app.post('/api/sensor-data', (req, res) => {
  const { turbidity } = req.body || {};
  if (typeof turbidity !== 'number') {
    return res.status(400).json({ error: 'turbidity (number) is required' });
  }
  try {
    const result = handleSensorData({ turbidity });
    return res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error handling sensor data', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/current-status', (req, res) => {
  const latest = getLatestReading();
  if (latest) {
    currentState = {
      turbidity: latest.turbidity,
      qualityStatus: latest.quality_status,
      mainValveStatus: latest.main_valve_status,
      diversionValveStatus: latest.diversion_valve_status,
      filtrationActive: !!latest.filtration_active,
      pumpStatus: latest.pump_status,
      sensorStatus: 'OK',
      connectionStatus: 'ONLINE',
      lastDataReceived: latest.timestamp,
      threshold: getThreshold()
    };
  }
  updateConnectionStatus();
  return res.json(currentState);
});

app.post('/api/control-valve', (req, res) => {
  const { target, action } = req.body || {};
  if (!['main', 'diversion', 'pump'].includes(target)) {
    return res.status(400).json({ error: 'Invalid target' });
  }
  if (!['open', 'close'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  if (target === 'main') {
    currentState.mainValveStatus = action === 'open' ? 'OPEN' : 'CLOSED';
  } else if (target === 'diversion') {
    currentState.diversionValveStatus = action === 'open' ? 'OPEN' : 'CLOSED';
  } else if (target === 'pump') {
    currentState.pumpStatus = action === 'open' ? 'ON' : 'OFF';
  }

  currentState.pumpStatus =
    currentState.mainValveStatus === 'OPEN' ||
    currentState.diversionValveStatus === 'OPEN'
      ? 'ON'
      : 'OFF';

  const timestamp = new Date().toISOString();
  insertFiltrationLog({
    timestamp,
    turbidity: currentState.turbidity ?? 0,
    action: `MANUAL_${target.toUpperCase()}_${action.toUpperCase()}`
  });

  return res.json({
    message: 'Valve command accepted (simulate sending to Arduino/ESP)',
    state: currentState
  });
});

app.get('/api/history', (req, res) => {
  const range = req.query.range || 'hour';
  const now = new Date();
  let from;
  if (range === 'day') {
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else {
    from = new Date(now.getTime() - 60 * 60 * 1000);
  }
  const rows = getReadingsSince(from.toISOString());
  return res.json({ range, readings: rows });
});

app.get('/api/filtration-logs', (req, res) => {
  const logs = getFiltrationLogs(200);
  return res.json({ logs });
});

app.get('/api/settings/threshold', (req, res) => {
  return res.json({ threshold: getThreshold(), defaultThreshold: DEFAULT_THRESHOLD });
});

app.post('/api/settings/threshold', (req, res) => {
  const { threshold } = req.body || {};
  const value = parseFloat(threshold);
  if (Number.isNaN(value) || value <= 0) {
    return res.status(400).json({ error: 'threshold must be a positive number' });
  }
  setThreshold(value);
  return res.json({ threshold: getThreshold() });
});

app.get('/api/system-status', (req, res) => {
  updateConnectionStatus();
  return res.json({
    sensorStatus: currentState.sensorStatus,
    connectionStatus: currentState.connectionStatus,
    lastDataReceived: currentState.lastDataReceived,
    pumpStatus: currentState.pumpStatus,
    mainValveStatus: currentState.mainValveStatus,
    diversionValveStatus: currentState.diversionValveStatus
  });
});

function startSimulator() {
  // eslint-disable-next-line no-console
  console.log('Starting mock data simulator (ENABLE_SIMULATOR=true)');
  setInterval(() => {
    const base = Math.random() < 0.7 ? 3 : 8;
    const jitter = (Math.random() - 0.5) * 1.5;
    const turbidity = Math.max(0, base + jitter);
    handleSensorData({ turbidity });
  }, 5000);
}

const path = require("path");

// serve frontend
app.use(express.static(path.join(__dirname, "../client/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Smart Water backend listening on port ${PORT}`);
  if (ENABLE_SIMULATOR) {
    startSimulator();
  }
});
