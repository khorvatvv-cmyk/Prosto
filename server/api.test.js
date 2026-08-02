import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const testDirectory = mkdtempSync(join(tmpdir(), 'prosto-api-'))
process.env.DB_PATH = join(testDirectory, 'prosto.db')
process.env.JWT_SECRET = 'test-only-secret-with-sufficient-length'
process.env.NODE_ENV = 'test'
process.env.ADMIN_EMAIL = 'admin@example.test'
process.env.ADMIN_PASSWORD = 'admin-password-2026'

const { app } = await import('./index.js')
const server = app.listen(0)
await new Promise((resolve, reject) => {
  server.once('listening', resolve)
  server.once('error', reject)
})

const address = server.address()
const baseUrl = `http://127.0.0.1:${address.port}/api`

async function jsonRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { response, data: await response.json() }
}

test.after(() => {
  server.close()
  rmSync(testDirectory, { recursive: true, force: true })
})

test('health reports the server and assistant configuration', async () => {
  const { response, data } = await jsonRequest('/health')
  assert.equal(response.status, 200)
  assert.equal(data.status, 'ok')
  assert.equal(data.assistant, 'not_configured')
})

test('registration, authentication and manager message work end to end', async () => {
  const unauthorized = await jsonRequest('/requests')
  assert.equal(unauthorized.response.status, 401)

  const registration = await jsonRequest('/auth/register', {
    method: 'POST',
    body: {
      email: 'USER@example.test',
      password: 'strong-password',
      inn: '4200000000',
      name: 'Тестовый пользователь',
    },
  })
  assert.equal(registration.response.status, 201)
  assert.equal(registration.data.user.email, 'user@example.test')
  assert.ok(registration.data.token)

  const managerMessage = await jsonRequest('/manager/messages', {
    method: 'POST',
    token: registration.data.token,
    body: { text: 'Нужна консультация по обновлению 1С' },
  })
  assert.equal(managerMessage.response.status, 201)
  assert.equal(managerMessage.data.request.level, 'l1')
  assert.equal(managerMessage.data.request.status, 'waiting')

  const requests = await jsonRequest('/requests', { token: registration.data.token })
  assert.equal(requests.response.status, 200)
  assert.equal(requests.data.requests.length, 1)

  const forbiddenAdmin = await jsonRequest('/admin/stats', { token: registration.data.token })
  assert.equal(forbiddenAdmin.response.status, 403)

  const adminLogin = await jsonRequest('/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.test', password: 'admin-password-2026' },
  })
  assert.equal(adminLogin.response.status, 200)
  assert.equal(adminLogin.data.user.role, 'admin')

  const adminStats = await jsonRequest('/admin/stats', { token: adminLogin.data.token })
  assert.equal(adminStats.response.status, 200)
  assert.equal(adminStats.data.server.status, 'ok')
  assert.equal(adminStats.data.requests, 1)
})
