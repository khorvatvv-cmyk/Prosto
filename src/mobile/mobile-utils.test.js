import test from 'node:test'
import assert from 'node:assert/strict'
import { friendlyError, isOpenRequest, statusMeta } from './mobile-utils.js'

test('client status labels never expose technical workflow values', () => {
  const cases = [
    [{ level: 'l0', status: 'open' }, 'Ассистент готовит ответ'],
    [{ level: 'l1', status: 'waiting' }, 'Подключаем специалиста'],
    [{ level: 'l1', status: 'in_progress' }, 'Специалист отвечает'],
    [{ level: 'l1', status: 'need_data' }, 'Нужна информация от вас'],
    [{ level: 'l1', status: 'result_ready' }, 'Готово решение'],
    [{ level: 'l1', status: 'done' }, 'Вопрос решён'],
  ]
  for (const [request, expected] of cases) assert.equal(statusMeta(request).label, expected)
})
test('request and error helpers expose mobile-friendly states', () => {
  assert.equal(isOpenRequest({ status: 'waiting' }), true)
  assert.equal(isOpenRequest({ status: 'done' }), false)
  assert.match(friendlyError({ code: 'network_error' }), /Проверьте подключение/)
  assert.match(friendlyError({ message: 'Организация не определена' }), /проходит проверку/)
})
