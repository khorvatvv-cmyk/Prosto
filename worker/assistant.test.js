import test from 'node:test'
import assert from 'node:assert/strict'
import { extractAssistantText, isAssistantConfigured } from './assistant.js'

test('assistant configuration requires both values', () => {
  assert.equal(isAssistantConfigured({}), false)
  assert.equal(isAssistantConfigured({ ASSISTANT_ID: 'id', ASSISTANT_API_KEY: 'key' }), true)
})

test('assistant response extraction supports the gateway shapes', () => {
  assert.equal(extractAssistantText({ reply: '  Готово  ' }), 'Готово')
  assert.equal(extractAssistantText({ data: { response: 'Ответ' } }), 'Ответ')
  assert.equal(extractAssistantText({ unexpected: true }), '')
})

