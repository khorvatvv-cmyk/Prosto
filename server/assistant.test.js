import test from 'node:test'
import assert from 'node:assert/strict'
import { extractAssistantText } from './assistant.js'

test('extractAssistantText reads the Portarius reply field', () => {
  assert.equal(extractAssistantText({ reply: '  Готово  ', thread_id: 'thread-1' }), 'Готово')
})

test('extractAssistantText supports known response shapes', () => {
  assert.equal(extractAssistantText({ response: 'Ответ' }), 'Ответ')
  assert.equal(extractAssistantText({ data: { reply: 'Вложенный ответ' } }), 'Вложенный ответ')
  assert.equal(extractAssistantText({ unexpected: true }), '')
})
