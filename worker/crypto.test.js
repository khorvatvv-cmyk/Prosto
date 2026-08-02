import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, signToken, verifyPassword, verifyToken } from './crypto.js'

test('password hashes are salted and verifiable', async () => {
  const secret = 'test-password-pepper-with-enough-entropy'
  const first = await hashPassword('strong-password', secret)
  const second = await hashPassword('strong-password', secret)
  assert.notEqual(first, second)
  assert.equal(await verifyPassword('strong-password', first, secret), true)
  assert.equal(await verifyPassword('wrong-password', first, secret), false)
  assert.equal(await verifyPassword('strong-password', first, 'another-secret'), false)
})

test('signed tokens verify and expire', async () => {
  const secret = 'test-secret-with-enough-entropy'
  const token = await signToken(42, secret, 1_000)
  assert.equal((await verifyToken(token, secret, 1_001)).userId, 42)
  assert.equal(await verifyToken(token, secret, 1_000 + 31 * 24 * 60 * 60), null)
  assert.equal(await verifyToken(`${token}x`, secret, 1_001), null)
})
