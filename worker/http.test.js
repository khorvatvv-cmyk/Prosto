import test from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'

const env = { DB: {} }

test('API responses allow the bundled Android client origin', async () => {
  const response = await worker.fetch(new Request('https://example.test/api/not-found'), env)

  assert.equal(response.status, 404)
  assert.equal(response.headers.get('access-control-allow-origin'), '*')
})

test('API preflight accepts authorization from the Android WebView', async () => {
  const response = await worker.fetch(new Request('https://example.test/api/health', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://localhost',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  }), env)

  assert.equal(response.status, 204)
  assert.match(response.headers.get('access-control-allow-headers') || '', /Authorization/i)
})
