const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'request_failed' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function getToken() {
  return localStorage.getItem('prosto_token')
}

async function api(path, options = {}, config = {}) {
  const token = getToken()
  const method = String(options.method || 'GET').toUpperCase()
  const maxAttempts = config.maxAttempts ?? (method === 'GET' ? 2 : 1)
  const timeoutMs = config.timeoutMs ?? 12000
  const onProgress = typeof config.onProgress === 'function' ? config.onProgress : () => {}
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let lastError = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    let timeout = null
    try {
      onProgress({ phase: 'request', attempt, maxAttempts })
      timeout = setTimeout(() => controller.abort(), timeoutMs)

      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
        cache: 'no-store',
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new ApiError(data.error || `Ошибка ${res.status}`, {
          status: res.status,
          code: 'http_error',
        })
      }
      onProgress({ phase: 'success', attempt, maxAttempts })
      return data
    } catch (err) {
      const isTimeout = err.name === 'AbortError'
      const isNetworkError = isTimeout || err.message === 'Failed to fetch'
      lastError = isTimeout
        ? new ApiError('Сервер не ответил вовремя', { code: 'timeout' })
        : isNetworkError
          ? new ApiError('Не удалось связаться с сервером', { code: 'network_error' })
          : err

      if (isNetworkError && attempt < maxAttempts) {
        onProgress({ phase: 'retry', attempt, maxAttempts })
        await new Promise(resolve => setTimeout(resolve, 1500))
        continue
      }
      throw lastError
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }
  throw lastError || new Error('Сервер недоступен')
}

export const authApi = {
  register: (email, password, inn, name, onProgress) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, inn, name }) }, {
      maxAttempts: 1,
      timeoutMs: 15000,
      onProgress,
    }),
  login: (email, password, onProgress) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, {
      maxAttempts: 2,
      timeoutMs: 12000,
      onProgress,
    }),
  me: () => api('/auth/me', {}, { maxAttempts: 1, timeoutMs: 8000 }),
}

export const systemApi = {
  wake: () => api('/health', {}, { maxAttempts: 1, timeoutMs: 8000 }),
}

export const profileApi = {
  update: (data) => api('/profile', { method: 'PUT', body: JSON.stringify(data) }, { maxAttempts: 1, timeoutMs: 10000 }),
}

export const adminApi = {
  stats: () => api('/admin/stats'),
  users: () => api('/admin/users'),
  requests: () => api('/admin/requests'),
  organizations: () => api('/admin/organizations'),
  requestMessages: (id) => api(`/admin/requests/${id}/messages`),
  testAssistant: (message) => api('/admin/test-assistant', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }, { maxAttempts: 1, timeoutMs: 30000 }),
}

export const requestsApi = {
  list: () => api('/requests'),
  create: (title, description) =>
    api('/requests', { method: 'POST', body: JSON.stringify({ title, description }) }),
  get: (id) => api(`/requests/${id}`),
  requestAssistant: (id) =>
    api(`/requests/${id}/assistant`, { method: 'POST' }, { maxAttempts: 1, timeoutMs: 90000 }),
  sendMessage: (id, text) =>
    api(`/requests/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  evaluate: (id, helped) =>
    api(`/requests/${id}/evaluate`, { method: 'POST', body: JSON.stringify({ helped }) }),
  messageManager: (text) =>
    api('/manager/messages', { method: 'POST', body: JSON.stringify({ text }) }),
}
