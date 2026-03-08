import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export async function fetchCurrentStatus() {
  const { data } = await api.get('/current-status');
  return data;
}

export async function fetchHistory(range = 'hour') {
  const { data } = await api.get('/history', { params: { range } });
  return data;
}

export async function fetchFiltrationLogs() {
  const { data } = await api.get('/filtration-logs');
  return data.logs || [];
}

export async function sendValveCommand(target, action) {
  const { data } = await api.post('/control-valve', { target, action });
  return data;
}

export async function fetchSystemStatus() {
  const { data } = await api.get('/system-status');
  return data;
}

export async function fetchThreshold() {
  const { data } = await api.get('/settings/threshold');
  return data;
}

export async function updateThreshold(threshold) {
  const { data } = await api.post('/settings/threshold', { threshold });
  return data;
}

