import test from 'node:test'
import assert from 'node:assert/strict'
import { canAccessPage, homePageForRole } from './access.js'

test('administrator can open every staff workspace', () => {
  assert.equal(canAccessPage('admin', 'specialist'), true)
  assert.equal(canAccessPage('admin', 'manager'), true)
  assert.equal(canAccessPage('admin', 'rof'), true)
})

test('staff roles stay inside their own workspace', () => {
  assert.equal(homePageForRole('specialist'), 'specialist')
  assert.equal(homePageForRole('manager'), 'manager')
  assert.equal(homePageForRole('rof'), 'rof')
  assert.equal(canAccessPage('specialist', 'manager'), false)
  assert.equal(canAccessPage('manager', 'rof'), false)
  assert.equal(canAccessPage('rof', 'specialist'), false)
})
