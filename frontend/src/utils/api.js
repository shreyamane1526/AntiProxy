const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function getAuthToken() {
  return sessionStorage.getItem('attendix.token') || localStorage.getItem('attendix.token');
}

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'API Request Failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    updateProfile: (profileData) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
    me: () => apiFetch('/auth/me'),
  },
  devices: {
    register: (deviceName, deviceIdentifier) => apiFetch('/devices/register', { method: 'POST', body: JSON.stringify({ deviceName, deviceIdentifier }) }),
    list: () => apiFetch('/devices'),
    revoke: (id) => apiFetch(`/devices/${id}/revoke`, { method: 'POST' }),
  },
  attendance: {
    createSession: (sessionData) => apiFetch('/attendance/sessions', { method: 'POST', body: JSON.stringify(sessionData) }),
    getSessions: () => apiFetch('/attendance/sessions'),
    getQr: (sessionId) => apiFetch(`/attendance/sessions/${sessionId}/qr?t=${Date.now()}`),
    endSession: (sessionId) => apiFetch(`/attendance/sessions/${sessionId}/end`, { method: 'POST' }),
    verifyQr: (sessionId, token) => apiFetch('/attendance/verify-qr', { method: 'POST', body: JSON.stringify({ sessionId, token }) }),
    verifyBle: (sessionDeviceName, bleRssi, bleSupported) => apiFetch('/attendance/verify-ble', { method: 'POST', body: JSON.stringify({ sessionDeviceName, bleRssi, bleSupported }) }),
    verifyLiveness: (faceImageData) => apiFetch('/attendance/verify-liveness', { method: 'POST', body: JSON.stringify({ faceImageData }) }),
    verify: (verificationData) => apiFetch('/attendance/verify', { method: 'POST', body: JSON.stringify(verificationData) }),
    mark: (payload) => apiFetch('/attendance/mark', { method: 'POST', body: JSON.stringify(payload) }),
    getTeacherAssignments: () => apiFetch('/attendance/teacher-assignments'),
    getStudentRecords: (studentId) => apiFetch(`/attendance/student/${studentId}`),
    getActiveSessions: (studentId) => apiFetch(`/attendance/active-sessions${studentId ? '?studentId=' + studentId : ''}`),
    getStudentHistory: (studentId, filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return apiFetch(`/attendance/student/${studentId}/history${params ? '?' + params : ''}`);
    },
    getSession: (sessionId) => apiFetch(`/attendance/sessions/${sessionId}`),
  },
  timetables: {
    get: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/timetables${query ? '?' + query : ''}`);
    },
  },
  analytics: {
    student: (id) => apiFetch(`/analytics/student/${id}`),
    class: (id) => apiFetch(`/analytics/class/${id}`),
    department: (id) => apiFetch(`/analytics/department/${id}`),
  },
  risk: {
    student: (id) => apiFetch(`/risk/student/${id}`),
  },
  rules: {
    get: () => apiFetch('/rules'),
    create: (rule) => apiFetch('/rules', { method: 'POST', body: JSON.stringify(rule) }),
    update: (id, updates) => apiFetch(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  },
  notifications: {
    list: () => apiFetch('/notifications'),
  },
  faceProfile: {
    register: (studentId, payload) =>
      apiFetch(`/students/${studentId}/face-profile`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    status: (studentId) => apiFetch(`/students/${studentId}/face-profile`),
  },
};
