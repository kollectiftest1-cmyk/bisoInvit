import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';

export const API_URL = config.API_URL;

const TOKEN_KEY = 'biso_token';
const USER_KEY = 'biso_user';

export function getApiUrl() {
  return API_URL;
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function getUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function clearAuth() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

async function request(path, opts = {}) {
  const url = API_URL;
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };
  const res = await fetch(`${url}${path}`, {
    ...opts,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // ---- Auth contrôleur ----
  login: async (username, password) => {
    const data = await request('/api/auth/controller/login', {
      method: 'POST',
      body: { username, password },
    });
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify({
      ...data.controller,
      events: data.events || [],
    }));
    return data;
  },
  me: () => request('/api/controller/me'),
  logout: clearAuth,

  // ---- Scan ----
  scan: (payload, scannerLabel) =>
    request('/api/scan', { method: 'POST', body: { payload, scanner_label: scannerLabel } }),
  stats: (eventId) => request(`/api/scan/stats?event_id=${encodeURIComponent(eventId)}`),
  history: (eventId) => request(`/api/scan/event/${encodeURIComponent(eventId)}/list`),
  events: () => request('/api/events'),
  event: (id) => request(`/api/events/${id}`),
};
