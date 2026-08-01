const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function getToken() {
  return localStorage.getItem('prosto_token')
}

async function api(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера')
  return data
}

export const authApi = {
  register: (email, password, inn, name) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, inn, name }) }),
  login: (email, password) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => api('/auth/me'),
}

export const requestsApi = {
  list: () => api('/requests'),
  create: (title, description) =>
    api('/requests', { method: 'POST', body: JSON.stringify({ title, description }) }),
  get: (id) => api(`/requests/${id}`),
  sendMessage: (id, text) =>
    api(`/requests/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  evaluate: (id, helped) =>
    api(`/requests/${id}/evaluate`, { method: 'POST', body: JSON.stringify({ helped }) }),
}
