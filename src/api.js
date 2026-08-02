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
  setUserRole: (id, role) => api(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }, { maxAttempts: 1 }),
  createSpecialist: (email, password, name) => api('/admin/specialists', { method: 'POST', body: JSON.stringify({ email, password, name, role: 'specialist' }) }, { maxAttempts: 1, timeoutMs: 15000 }),
  createManager: (email, password, name) => api('/admin/specialists', { method: 'POST', body: JSON.stringify({ email, password, name, role: 'manager' }) }, { maxAttempts: 1, timeoutMs: 15000 }),
  createRof: (email, password, name) => api('/admin/specialists', { method: 'POST', body: JSON.stringify({ email, password, name, role: 'rof' }) }, { maxAttempts: 1, timeoutMs: 15000 }),
  assignSpecialist: (id, specialistId) => api(`/admin/requests/${id}/assign`, { method: 'POST', body: JSON.stringify({ specialist_id: specialistId }) }, { maxAttempts: 1 }),
}

export const specialistApi = {
  queue: (filter, search) => api(`/specialist/queue${filter || search ? '?' + new URLSearchParams({ filter: filter || 'waiting', ...(search ? { search } : {}) }).toString() : ''}`),
  myRequests: () => api('/specialist/my-requests'),
  requestDetail: (id) => api(`/specialist/requests/${id}`),
  take: (id) => api(`/specialist/requests/${id}/take`, { method: 'POST' }, { maxAttempts: 1 }),
  release: (id) => api(`/specialist/requests/${id}/release`, { method: 'POST' }, { maxAttempts: 1 }),
  sendMessage: (id, text) => api(`/specialist/requests/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }, { maxAttempts: 1 }),
  internalNote: (id, text) => api(`/specialist/requests/${id}/internal-note`, { method: 'POST', body: JSON.stringify({ text }) }, { maxAttempts: 1 }),
  needData: (id, text) => api(`/specialist/requests/${id}/need-data`, { method: 'POST', body: JSON.stringify({ text }) }, { maxAttempts: 1 }),
  result: (id, text) => api(`/specialist/requests/${id}/result`, { method: 'POST', body: JSON.stringify({ text }) }, { maxAttempts: 1 }),
  transferToManager: (id, data) => api(`/specialist/requests/${id}/transfer-to-manager`, { method: 'POST', body: JSON.stringify(data) }, { maxAttempts: 1 }),
  clientChat: (userId) => api('/specialist/client-chat?user_id=' + userId),
}

export const managerApi = {
  dashboard: () => api('/manager/dashboard'),
  clients: (tab) => api(`/manager/clients${tab ? `?tab=${tab}` : ''}`),
  orgDetail: (id) => api(`/manager/orgs/${id}`),
  assignOrg: (id, managerId) => api(`/manager/orgs/${id}/assign`, { method: 'POST', body: JSON.stringify({ manager_id: managerId }) }, { maxAttempts: 1 }),
  unassignOrg: (id) => api(`/manager/orgs/${id}/unassign`, { method: 'POST' }, { maxAttempts: 1 }),
  serviceStatus: (id, status) => api(`/manager/orgs/${id}/service-status`, { method: 'POST', body: JSON.stringify({ service_status: status }) }, { maxAttempts: 1 }),
  pendingUsers: () => api('/manager/pending-users'),
  approveUser: (orgId, userId, action) => api('/manager/approve-user', { method: 'POST', body: JSON.stringify({ organization_id: orgId, user_id: userId, action }) }, { maxAttempts: 1 }),
  tasks: (status) => api(`/manager/tasks${status ? `?status=${status}` : ''}`),
  updateTask: (id, data) => api(`/manager/tasks/${id}`, { method: 'POST', body: JSON.stringify(data) }, { maxAttempts: 1 }),
}

export const rofApi = {
  dashboard: () => api('/rof/dashboard'),
  clients: (search) => api(`/rof/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  l1Queue: (filter) => api(`/rof/l1-queue${filter ? `?filter=${filter}` : ''}`),
}

export const chatApi = {
  list: () => api('/chat/list'),
  messages: (convId) => api(`/chat/${convId}/messages`),
  send: (text, convId, clientUserId) => api('/chat/send', { method: 'POST', body: JSON.stringify({ text, conversation_id: convId, client_user_id: clientUserId }) }),
}

export const campaignApi = {
  list: (status) => api(`/campaigns${status ? `?status=${status}` : ''}`),
  create: (data) => api('/campaigns', { method: 'POST', body: JSON.stringify(data) }, { maxAttempts: 1 }),
  deliveries: (id) => api(`/campaigns/${id}/deliveries`),
  activate: (id) => api(`/campaigns/${id}/activate`, { method: 'POST' }, { maxAttempts: 1, timeoutMs: 30000 }),
}

export const feedApi = {
  list: () => api('/feed'),
  action: (deliveryId, action) => api(`/feed/${deliveryId}/action`, { method: 'POST', body: JSON.stringify({ action }) }, { maxAttempts: 1 }),
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
