const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('biso_token');
}

export function setToken(t) {
  if (t) localStorage.setItem('biso_token', t);
  else localStorage.removeItem('biso_token');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('biso_user') || 'null');
  } catch {
    return null;
  }
}

export function setStoredUser(u) {
  if (u) localStorage.setItem('biso_user', JSON.stringify(u));
  else localStorage.removeItem('biso_user');
}

async function request(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== 'string') {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.details = data.details;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  url: API_URL,
  // auth
  login: (user, password) => request('/api/auth/login', { method: 'POST', body: { user, password } }),
  // templates
  templates: () => request('/api/templates'),
  // events
  listEvents: () => request('/api/events'),
  getEvent: (id) => request(`/api/events/${id}`),
  createEvent: (formData) => request('/api/events', { method: 'POST', body: formData }),
  updateEvent: (id, formData) => request(`/api/events/${id}`, { method: 'PATCH', body: formData }),
  deleteEvent: (id) => request(`/api/events/${id}`, { method: 'DELETE' }),
  // invitations
  listInvitations: (eventId) =>
    request(`/api/invitations${eventId ? `?event_id=${encodeURIComponent(eventId)}` : ''}`),
  getInvitationByCode: (code) => request(`/api/invitations/code/${code}`),
  createInvitation: (data) => request('/api/invitations', { method: 'POST', body: data }),
  deleteInvitation: (id) => request(`/api/invitations/${id}`, { method: 'DELETE' }),
  // stats
  scanStats: (eventId) => request(`/api/scan/stats?event_id=${encodeURIComponent(eventId)}`),
  // controllers
  listControllers: () => request('/api/controllers'),
  createController: (data) => request('/api/controllers', { method: 'POST', body: data }),
  updateController: (id, data) => request(`/api/controllers/${id}`, { method: 'PATCH', body: data }),
  deleteController: (id) => request(`/api/controllers/${id}`, { method: 'DELETE' }),
  // admins (super_admin only)
  listAdmins: () => request('/api/admins'),
  createAdmin: (data) => request('/api/admins', { method: 'POST', body: data }),
  updateAdmin: (id, data) => request(`/api/admins/${id}`, { method: 'PATCH', body: data }),
  deleteAdmin: (id) => request(`/api/admins/${id}`, { method: 'DELETE' }),
};

export function fileUrl(p) {
  if (!p) return null;
  if (/^https?:/.test(p)) return p;
  return `${API_URL}${p}`;
}
