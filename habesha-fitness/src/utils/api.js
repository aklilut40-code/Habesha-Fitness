// Central API client connecting the React frontend to the Node/PostgreSQL backend

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

let authToken = localStorage.getItem('habesha.token') || '';

export function setToken(token) {
  authToken = token || '';
  if (token) {
    localStorage.setItem('habesha.token', token);
  } else {
    localStorage.removeItem('habesha.token');
  }
}

export function getToken() {
  return authToken;
}

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: body?.error || `Request failed (${res.status})`,
        details: body?.details,
      };
    }

    return { ok: true, status: res.status, data: body };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message || 'Cannot reach the backend server',
    };
  }
}

export const api = {
  // Auth
  login: (email, password) => apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (form) => apiRequest('/api/auth/register', { method: 'POST', body: form }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/api/auth/me', { method: 'GET' }),
  updateProfile: (profile) => apiRequest('/api/auth/profile', { method: 'PATCH', body: profile }),
  changePassword: (current, next) => apiRequest('/api/auth/change-password', { method: 'POST', body: { current, next } }),

  // Data
  getPublicData: () => apiRequest('/api/public', { method: 'GET' }),
  getAllData: () => apiRequest('/api/data', { method: 'GET' }),
  resetData: () => apiRequest('/api/reset', { method: 'POST' }),

  // Members
  addMember: (member) => apiRequest('/api/members', { method: 'POST', body: member }),
  updateMember: (id, member) => apiRequest(`/api/members/${encodeURIComponent(id)}`, { method: 'PATCH', body: member }),
  deleteMember: (id) => apiRequest(`/api/members/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  assignPlan: (memberId, planId, recordPayment = true, method = 'Cash') =>
    apiRequest(`/api/members/${encodeURIComponent(memberId)}/assign-plan`, {
      method: 'POST',
      body: { planId, recordPayment, method },
    }),

  // Plans
  addPlan: (plan) => apiRequest('/api/plans', { method: 'POST', body: plan }),
  updatePlan: (id, plan) => apiRequest(`/api/plans/${encodeURIComponent(id)}`, { method: 'PATCH', body: plan }),
  deletePlan: (id) => apiRequest(`/api/plans/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Trainers
  addTrainer: (trainer) => apiRequest('/api/trainers', { method: 'POST', body: trainer }),
  updateTrainer: (id, trainer) => apiRequest(`/api/trainers/${encodeURIComponent(id)}`, { method: 'PATCH', body: trainer }),
  deleteTrainer: (id) => apiRequest(`/api/trainers/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Payments
  addPayment: (payment) => apiRequest('/api/payments', { method: 'POST', body: payment }),
  updatePayment: (id, payment) => apiRequest(`/api/payments/${encodeURIComponent(id)}`, { method: 'PATCH', body: payment }),
  deletePayment: (id) => apiRequest(`/api/payments/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Attendance
  checkIn: (memberId) => apiRequest('/api/attendance/check-in', { method: 'POST', body: { memberId } }),
  checkOut: (id) => apiRequest(`/api/attendance/${encodeURIComponent(id)}/check-out`, { method: 'POST' }),
  deleteAttendance: (id) => apiRequest(`/api/attendance/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Settings
  updateSettings: (settings) => apiRequest('/api/settings', { method: 'PATCH', body: settings }),
  updateNotifications: (notifications) => apiRequest('/api/notifications', { method: 'PATCH', body: notifications }),
};
