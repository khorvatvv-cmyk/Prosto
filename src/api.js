const API_URL = 'https://prosto-0eq7.onrender.com/api'

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

  // Retry до 3 раз — Render free tier может просыпаться
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), attempt === 1 ? 30000 : 15000)

      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`)
      return data
    } catch (err) {
      lastError = err
      if (err.name === 'AbortError' || err.message === 'Failed to fetch') {
        // Render просыпается — ждём и повторяем
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000 * attempt))
          continue
        }
      }
      throw err
    }
  }
  throw lastError || new Error('Сервер недоступен')
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
