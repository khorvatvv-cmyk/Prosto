import { askAssistant, isAssistantConfigured } from './assistant.js'
import { hashPassword, signToken, verifyPassword, verifyToken } from './crypto.js'

const API_PREFIX = '/api'
const MAX_TEXT_LENGTH = 10_000

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      ...extraHeaders,
    },
  })
}

function errorResponse(error) {
  const status = Number(error?.status) || 500
  if (status >= 500) console.error(error?.stack || error?.message || error)
  return json({ error: status >= 500 ? 'Внутренняя ошибка сервера' : error.message }, status)
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

async function requestBody(request) {
  try {
    return await request.json()
  } catch {
    throw httpError(400, 'Некорректный JSON')
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    inn: user.inn,
    name: user.name,
    organization: user.organization,
    role: user.role || 'user',
    activity_type: user.activity_type || '',
    software_product: user.software_product || '',
    product_version: user.product_version || '',
    config_type: user.config_type || '',
    customizations: user.customizations || '',
  }
}

function assistantStatus(env) {
  return isAssistantConfigured(env) ? 'configured' : 'not_configured'
}

function buildClientContext(user) {
  const lines = []
  if (user.activity_type) lines.push(`Вид деятельности: ${user.activity_type}`)
  if (user.software_product) lines.push(`Программный продукт: ${user.software_product}`)
  if (user.product_version) lines.push(`Версия: ${user.product_version}`)
  if (user.config_type) lines.push(`Конфигурация: ${user.config_type}`)
  if (user.customizations) lines.push(`Что доработано: ${user.customizations}`)
  return lines.length ? lines.join('\n') : null
}

function buildContextualMessage(message, user) {
  const context = buildClientContext(user)
  if (!context) return message
  return `Данные клиента:\n${context}\n\nВопрос клиента:\n${message}`
}

function passwordSecret(env) {
  return env.PASSWORD_PEPPER || env.JWT_SECRET
}

async function findUserByEmail(env, email) {
  return env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
}

async function findUserById(env, id) {
  return env.DB.prepare(
    'SELECT id, email, inn, name, organization, role, activity_type, software_product, product_version, config_type, customizations, created_at FROM users WHERE id = ?',
  ).bind(id).first()
}

async function authenticate(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw httpError(401, 'Нет токена')

  const payload = await verifyToken(token, env.JWT_SECRET)
  if (!payload) throw httpError(401, 'Неверный токен')
  const user = await findUserById(env, payload.userId)
  if (!user) throw httpError(401, 'Пользователь не найден')

  const adminEmail = normalizeEmail(env.ADMIN_EMAIL)
  if (adminEmail && user.email === adminEmail && user.role !== 'admin') {
    await env.DB.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(user.id).run()
    user.role = 'admin'
  }
  return user
}

function requireAdmin(user) {
  if (user.role !== 'admin') throw httpError(403, 'Доступ только для администратора')
}

async function getRequestForUser(env, id, userId) {
  return env.DB.prepare(`
    SELECT r.*, s.name AS specialist_name, s.email AS specialist_email
    FROM requests r
    LEFT JOIN users s ON r.assigned_to = s.id
    WHERE r.id = ? AND r.user_id = ?
  `).bind(id, userId).first()
}

async function getAnyRequest(env, id) {
  return env.DB.prepare('SELECT * FROM requests WHERE id = ?').bind(id).first()
}

async function getMessages(env, requestId, includeInternal = true) {
  const sql = includeInternal
    ? 'SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC, id ASC'
    : 'SELECT * FROM messages WHERE request_id = ? AND (is_internal = 0 OR is_internal IS NULL) ORDER BY created_at ASC, id ASC'
  const result = await env.DB.prepare(sql).bind(requestId).all()
  return result.results || []
}

async function addMessage(env, requestId, sender, text, isInternal = false) {
  const result = await env.DB.prepare(
    'INSERT INTO messages (request_id, sender, text, is_internal) VALUES (?, ?, ?, ?)',
  ).bind(requestId, sender, text, isInternal ? 1 : 0).run()
  return {
    id: result.meta.last_row_id,
    requestId,
    sender,
    text,
    is_internal: isInternal ? 1 : 0,
  }
}

async function updateRequest(env, id, updates) {
  const allowedKeys = ['status', 'level', 'title', 'description', 'assistant_thread_id', 'assigned_to', 'l1_transferred_at', 'l1_taken_at', 'last_message_at', 'result_message']
  const entries = Object.entries(updates).filter(([key]) => allowedKeys.includes(key))
  if (entries.length) {
    const assignments = entries.map(([key]) => `${key} = ?`).join(', ')
    await env.DB.prepare(`UPDATE requests SET ${assignments} WHERE id = ?`)
      .bind(...entries.map(([, value]) => value), id)
      .run()
  }
  return getAnyRequest(env, id)
}

async function createAdminOnFirstLogin(env, email, password) {
  const adminEmail = normalizeEmail(env.ADMIN_EMAIL)
  const configuredPassword = String(env.ADMIN_PASSWORD || '')
  if (!adminEmail || email !== adminEmail || configuredPassword.length < 12 || password !== configuredPassword) {
    return null
  }

  const passwordHash = await hashPassword(configuredPassword, passwordSecret(env))
  await env.DB.prepare(
    "INSERT INTO users (email, password, name, role) VALUES (?, ?, 'Администратор', 'admin')",
  ).bind(adminEmail, passwordHash).run()
  return findUserByEmail(env, adminEmail)
}

async function handleProfileUpdate(request, env) {
  const user = await authenticate(request, env)
  const body = await requestBody(request)
  const allowedFields = ['activity_type', 'software_product', 'product_version', 'config_type', 'customizations']
  const updates = {}
  for (const field of allowedFields) {
    if (field in body) updates[field] = String(body[field] || '').trim().slice(0, 2000)
  }
  if (!Object.keys(updates).length) throw httpError(400, 'Нет допустимых изменений')
  const assignments = Object.keys(updates).map(key => `${key} = ?`).join(', ')
  await env.DB.prepare(`UPDATE users SET ${assignments} WHERE id = ?`)
    .bind(...Object.values(updates), user.id)
    .run()
  const updated = await findUserById(env, user.id)
  return json({ user: publicUser(updated) })
}

async function handleHealth(env) {
  await env.DB.prepare('SELECT 1 AS ok').first()
  return json({
    status: 'ok',
    platform: 'cloudflare-workers',
    assistant: assistantStatus(env),
    database: 'ok',
    uptime: 0,
    startedAt: null,
    time: new Date().toISOString(),
  })
}

async function handleRegister(request, env) {
  const body = await requestBody(request)
  const email = normalizeEmail(body.email)
  const password = String(body.password || '')
  const inn = String(body.inn || '').trim()
  const name = String(body.name || '').trim()

  if (!email || !password || !inn) throw httpError(400, 'Email, пароль и ИНН обязательны')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'Укажите корректный email')
  if (password.length < 8) throw httpError(400, 'Пароль должен содержать не менее 8 символов')
  if (!/^\d{10}(\d{2})?$/.test(inn)) throw httpError(400, 'ИНН должен содержать 10 или 12 цифр')
  if (await findUserByEmail(env, email)) throw httpError(409, 'Пользователь с таким email уже существует')

  const role = normalizeEmail(env.ADMIN_EMAIL) === email ? 'admin' : 'user'
  const passwordHash = await hashPassword(password, passwordSecret(env))
  let result
  try {
    result = await env.DB.prepare(
      'INSERT INTO users (email, password, inn, name, role) VALUES (?, ?, ?, ?, ?)',
    ).bind(email, passwordHash, inn, name, role).run()
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) throw httpError(409, 'Пользователь с таким email уже существует')
    throw error
  }
  const user = await findUserById(env, result.meta.last_row_id)
  return json({ token: await signToken(user.id, env.JWT_SECRET), user: publicUser(user) }, 201)
}

async function handleLogin(request, env) {
  const body = await requestBody(request)
  const email = normalizeEmail(body.email)
  const password = String(body.password || '')
  if (!email || !password) throw httpError(400, 'Email и пароль обязательны')

  let user = await findUserByEmail(env, email)
  if (!user) user = await createAdminOnFirstLogin(env, email, password)
  if (!user || !(await verifyPassword(password, user.password, passwordSecret(env)))) {
    throw httpError(401, 'Неверный email или пароль')
  }

  return json({ token: await signToken(user.id, env.JWT_SECRET), user: publicUser(user) })
}

async function handleRequestsList(request, env) {
  const user = await authenticate(request, env)
  const result = await env.DB.prepare(`
    SELECT r.*, s.name AS specialist_name
    FROM requests r
    LEFT JOIN users s ON r.assigned_to = s.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC, r.id DESC
  `).bind(user.id).all()
  return json({ requests: result.results || [] })
}

async function handleRequestCreate(request, env) {
  const user = await authenticate(request, env)
  const body = await requestBody(request)
  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()
  if (!title) throw httpError(400, 'Опишите, что случилось')
  if (title.length > 200) throw httpError(400, 'Сократите заголовок до 200 символов')
  if (description.length > MAX_TEXT_LENGTH) throw httpError(400, 'Сократите описание до 10 000 символов')

  const created = await env.DB.prepare(
    'INSERT INTO requests (user_id, title, description) VALUES (?, ?, ?)',
  ).bind(user.id, title, description).run()
  const requestId = created.meta.last_row_id
  const text = description || title
  await addMessage(env, requestId, 'user', text)
  return json({ request: await getRequestForUser(env, requestId, user.id) }, 201)
}

async function handleInitialAssistantAnswer(request, env, id) {
  const user = await authenticate(request, env)
  const item = await getRequestForUser(env, id, user.id)
  if (!item) throw httpError(404, 'Вопрос не найден')

  const messages = await getMessages(env, id)
  const existingAnswer = messages.find(message => message.sender === 'assistant')
  if (existingAnswer) {
    return json({ message: existingAnswer, request: item, reused: true })
  }
  if (item.status !== 'open' || item.level !== 'l0') {
    return json({ message: null, request: item, reused: true })
  }

  const text = String(item.description || item.title || '').trim()
  const fullUser = await findUserById(env, user.id)
  const contextualMessage = buildContextualMessage(text, fullUser)
  const result = await askAssistant(contextualMessage, item.assistant_thread_id, env)
  const assistantMessage = await addMessage(env, id, 'assistant', result.text)
  const updatedRequest = await updateRequest(env, id, {
    ...(result.threadId ? { assistant_thread_id: result.threadId } : {}),
    ...(!result.available ? { status: 'waiting', level: 'l1', l1_transferred_at: new Date().toISOString() } : {}),
  })
  return json({ message: assistantMessage, request: updatedRequest, available: result.available })
}

async function handleManagerMessage(request, env) {
  const user = await authenticate(request, env)
  const body = await requestBody(request)
  const text = String(body.text || '').trim()
  if (!text) throw httpError(400, 'Сообщение пустое')
  if (text.length > MAX_TEXT_LENGTH) throw httpError(400, 'Сократите сообщение до 10 000 символов')

  const title = text.length > 80 ? `${text.slice(0, 77)}…` : text
  const created = await env.DB.prepare(
    "INSERT INTO requests (user_id, title, description, status, level, l1_transferred_at) VALUES (?, ?, ?, 'waiting', 'l1', ?)",
  ).bind(user.id, title, text, new Date().toISOString()).run()
  const requestId = created.meta.last_row_id
  await addMessage(env, requestId, 'user', text)
  await addMessage(env, requestId, 'system', 'Сообщение передано команде сопровождения. Повторно описывать вопрос не нужно.')
  return json({ request: await getRequestForUser(env, requestId, user.id) }, 201)
}

async function handleRequestDetail(request, env, id) {
  const user = await authenticate(request, env)
  const item = await getRequestForUser(env, id, user.id)
  if (!item) throw httpError(404, 'Вопрос не найден')
  return json({ request: item, messages: await getMessages(env, id, false) })
}

async function handleRequestMessage(request, env, id) {
  const user = await authenticate(request, env)
  const item = await getRequestForUser(env, id, user.id)
  if (!item) throw httpError(404, 'Вопрос не найден')
  if (item.status === 'done') throw httpError(409, 'Вопрос уже решён')

  const body = await requestBody(request)
  const text = String(body.text || '').trim()
  if (!text) throw httpError(400, 'Сообщение пустое')
  if (text.length > MAX_TEXT_LENGTH) throw httpError(400, 'Сократите сообщение до 10 000 символов')
  await addMessage(env, id, 'user', text)
  await updateRequest(env, id, { last_message_at: new Date().toISOString() })

  if (item.level === 'l0') {
    const fullUser = await findUserById(env, user.id)
    const contextualMessage = buildContextualMessage(text, fullUser)
    const result = await askAssistant(contextualMessage, item.assistant_thread_id, env)
    await addMessage(env, id, 'assistant', result.text)
    await updateRequest(env, id, {
      ...(result.threadId ? { assistant_thread_id: result.threadId } : {}),
      ...(!result.available ? { status: 'waiting', level: 'l1', l1_transferred_at: new Date().toISOString() } : {}),
    })
    return json({ message: { sender: 'assistant', text: result.text } })
  }

  if (item.level === 'l1') {
    if (item.status === 'need_data') {
      await updateRequest(env, id, { status: 'in_progress' })
      await addMessage(env, id, 'system', 'Клиент предоставил дополнительные данные. Обращение вернулось в работу.')
    }
    return json({ message: null })
  }
  return json({ message: null })
}

async function handleRequestEvaluation(request, env, id) {
  const user = await authenticate(request, env)
  const item = await getRequestForUser(env, id, user.id)
  if (!item) throw httpError(404, 'Вопрос не найден')
  const body = await requestBody(request)

  if (body.helped === true) {
    await updateRequest(env, id, { status: 'done' })
    await addMessage(env, id, 'system', 'Вопрос решён')
  } else if (body.helped === false) {
    if (item.level === 'l0') {
      await updateRequest(env, id, { status: 'waiting', level: 'l1', l1_transferred_at: new Date().toISOString() })
      await addMessage(env, id, 'system', 'Подключаем специалиста. Повторно описывать не нужно.')
    } else if (item.level === 'l1') {
      if (item.status !== 'result_ready') throw httpError(400, 'Подтверждение результата доступно только когда результат готов')
      await updateRequest(env, id, { status: 'returned' })
      await addMessage(env, id, 'system', 'Клиент сообщил, что решение не помогло. Обращение вернулось в работу.')
    } else {
      throw httpError(400, 'Неверное действие для текущего состояния')
    }
  } else {
    throw httpError(400, 'Передайте helped: true или false')
  }
  return json({ request: await getRequestForUser(env, id, user.id) })
}

async function adminContext(request, env) {
  const user = await authenticate(request, env)
  requireAdmin(user)
  return user
}

function countFromResult(result) {
  return Number(result?.results?.[0]?.count || 0)
}

async function handleAdminStats(request, env) {
  await adminContext(request, env)
  const [users, requests, messages, openRequests, doneRequests, organizations] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS count FROM users'),
    env.DB.prepare('SELECT COUNT(*) AS count FROM requests'),
    env.DB.prepare('SELECT COUNT(*) AS count FROM messages'),
    env.DB.prepare("SELECT COUNT(*) AS count FROM requests WHERE status IN ('open', 'waiting')"),
    env.DB.prepare("SELECT COUNT(*) AS count FROM requests WHERE status = 'done'"),
    env.DB.prepare("SELECT COUNT(DISTINCT inn) AS count FROM users WHERE inn IS NOT NULL AND inn != ''"),
  ])
  return json({
    users: countFromResult(users),
    requests: countFromResult(requests),
    messages: countFromResult(messages),
    openRequests: countFromResult(openRequests),
    doneRequests: countFromResult(doneRequests),
    organizations: countFromResult(organizations),
    server: {
      status: 'ok',
      platform: 'cloudflare-workers',
      assistant: assistantStatus(env),
      database: 'ok',
      uptime: 0,
      startedAt: null,
      time: new Date().toISOString(),
    },
  })
}

async function handleAdminUsers(request, env) {
  await adminContext(request, env)
  const result = await env.DB.prepare(
    'SELECT id, email, inn, name, organization, role, activity_type, software_product, product_version, config_type, customizations, created_at FROM users ORDER BY created_at DESC, id DESC',
  ).all()
  return json({ users: result.results || [] })
}

async function allRequests(env) {
  const result = await env.DB.prepare(`
    SELECT r.*, u.email, u.name, u.inn, u.organization,
      (SELECT COUNT(*) FROM messages WHERE request_id = r.id) AS msg_count
    FROM requests r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC, r.id DESC
  `).all()
  return result.results || []
}

async function handleAdminRequests(request, env) {
  await adminContext(request, env)
  return json({ requests: await allRequests(env) })
}

async function handleAdminOrganizations(request, env) {
  await adminContext(request, env)
  const usersResult = await env.DB.prepare(
    "SELECT id, email, inn, name, organization, created_at FROM users WHERE role = 'user' ORDER BY inn, id",
  ).all()
  const requestsResult = await env.DB.prepare(
    'SELECT id, user_id, title, status, created_at FROM requests ORDER BY created_at DESC, id DESC',
  ).all()
  const requestsByUser = new Map()
  for (const item of requestsResult.results || []) {
    if (!requestsByUser.has(item.user_id)) requestsByUser.set(item.user_id, [])
    requestsByUser.get(item.user_id).push(item)
  }

  const organizations = new Map()
  for (const user of usersResult.results || []) {
    const inn = user.inn || 'без ИНН'
    if (!organizations.has(inn)) organizations.set(inn, { inn, users: [], requests: [], requestCount: 0 })
    const organization = organizations.get(inn)
    const userRequests = requestsByUser.get(user.id) || []
    organization.users.push(user)
    organization.requests.push(...userRequests)
    organization.requestCount += userRequests.length
    if (userRequests[0] && (!organization.lastRequest || userRequests[0].created_at > organization.lastRequest)) {
      organization.lastRequest = userRequests[0].created_at
    }
  }
  return json({ organizations: [...organizations.values()] })
}

async function handleAdminRequestMessages(request, env, id) {
  await adminContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Вопрос не найден')
  return json({ request: item, messages: await getMessages(env, id) })
}

async function handleAdminRequestUpdate(request, env, id) {
  await adminContext(request, env)
  if (!(await getAnyRequest(env, id))) throw httpError(404, 'Вопрос не найден')
  const body = await requestBody(request)
  const updates = {}
  if (['open', 'waiting', 'done'].includes(body.status)) updates.status = body.status
  if (['l0', 'l1'].includes(body.level)) updates.level = body.level
  if (!Object.keys(updates).length) throw httpError(400, 'Нет допустимых изменений')
  return json({ request: await updateRequest(env, id, updates) })
}

async function handleAdminRequestMessage(request, env, id) {
  await adminContext(request, env)
  if (!(await getAnyRequest(env, id))) throw httpError(404, 'Вопрос не найден')
  const body = await requestBody(request)
  const text = String(body.text || '').trim()
  if (!text) throw httpError(400, 'Сообщение пустое')
  if (text.length > MAX_TEXT_LENGTH) throw httpError(400, 'Сократите сообщение до 10 000 символов')
  return json({ message: await addMessage(env, id, 'admin', text) }, 201)
}

async function handleAdminAssistantTest(request, env) {
  await adminContext(request, env)
  const body = await requestBody(request)
  const message = String(body.message || '').trim()
  if (!message) throw httpError(400, 'Введите сообщение')
  if (message.length > 2_000) throw httpError(400, 'Сократите сообщение до 2 000 символов')
  return json(await askAssistant(message, null, env))
}

function requireSpecialist(user) {
  if (user.role !== 'specialist' && user.role !== 'admin') throw httpError(403, 'Доступ только для специалиста')
}

async function specialistContext(request, env) {
  const user = await authenticate(request, env)
  requireSpecialist(user)
  return user
}

async function requestWithClientInfo(env, requestId) {
  return env.DB.prepare(`
    SELECT r.*, u.email AS client_email, u.name AS client_name, u.inn AS client_inn,
      u.organization AS client_organization, u.activity_type, u.software_product,
      u.product_version, u.config_type, u.customizations,
      s.name AS specialist_name
    FROM requests r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN users s ON r.assigned_to = s.id
    WHERE r.id = ?
  `).bind(requestId).first()
}

async function handleSpecialistQueue(request, env) {
  await specialistContext(request, env)
  const url = new URL(request.url)
  const filter = url.searchParams.get('filter') || 'waiting'
  const search = url.searchParams.get('search') || ''

  let sql = `
    SELECT r.*, u.email AS client_email, u.name AS client_name, u.inn AS client_inn,
      u.organization AS client_organization, u.activity_type, u.software_product,
      u.product_version, u.config_type, u.customizations
    FROM requests r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.level = 'l1'
  `
  const params = []
  const validFilters = {
    waiting: "r.status = 'waiting'",
    'in-progress': "r.status = 'in_progress'",
    'need-data': "r.status = 'need_data'",
    'result-ready': "r.status = 'result_ready'",
    returned: "r.status = 'returned'",
    done: "r.status = 'done'",
    all: "1=1",
  }
  sql += ` AND (${validFilters[filter] || validFilters.waiting})`

  if (search.trim()) {
    sql += ` AND (u.name LIKE ? OR u.inn LIKE ? OR r.title LIKE ? OR u.organization LIKE ?)`
    const pattern = `%${search.trim()}%`
    params.push(pattern, pattern, pattern, pattern)
  }

  if (filter === 'waiting') {
    sql += ` ORDER BY r.l1_transferred_at ASC, r.created_at ASC, r.id ASC`
  } else {
    sql += ` ORDER BY r.last_message_at DESC, r.created_at DESC, r.id DESC`
  }

  const stmt = env.DB.prepare(sql)
  const result = params.length ? await stmt.bind(...params).all() : await stmt.all()
  return json({ requests: result.results || [] })
}

async function handleSpecialistMyRequests(request, env) {
  const user = await specialistContext(request, env)
  const result = await env.DB.prepare(`
    SELECT r.*, u.email AS client_email, u.name AS client_name, u.inn AS client_inn,
      u.organization AS client_organization, u.activity_type, u.software_product,
      u.product_version, u.config_type, u.customizations
    FROM requests r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.assigned_to = ? AND r.level = 'l1' AND r.status != 'done'
    ORDER BY r.last_message_at DESC, r.created_at DESC, r.id DESC
  `).bind(user.id).all()
  return json({ requests: result.results || [] })
}

async function handleSpecialistRequestDetail(request, env, id) {
  await specialistContext(request, env)
  const item = await requestWithClientInfo(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  if (item.level !== 'l1' && item.level !== 'l0') throw httpError(400, 'Это обращение не на линии L1')
  return json({ request: item, messages: await getMessages(env, id, true) })
}

async function handleSpecialistTake(request, env, id) {
  const user = await specialistContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  if (item.level !== 'l1') throw httpError(400, 'Это обращение не на линии L1')
  if (item.status !== 'waiting' && item.status !== 'returned') throw httpError(400, 'Обращение уже в работе или завершено')
  if (item.assigned_to && item.assigned_to !== user.id && item.status !== 'returned') {
    const specialist = await findUserById(env, item.assigned_to)
    throw httpError(409, `Обращение уже взял: ${specialist?.name || specialist?.email || 'другой специалист'}`)
  }
  await updateRequest(env, id, { assigned_to: user.id, status: 'in_progress', l1_taken_at: new Date().toISOString() })
  await addMessage(env, id, 'system', `Специалист ${user.name || user.email} принял обращение в работу.`)
  return json({ request: await requestWithClientInfo(env, id) })
}

async function handleSpecialistRelease(request, env, id) {
  const user = await specialistContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  if (item.assigned_to !== user.id && user.role !== 'admin') throw httpError(403, 'Вы не назначены на это обращение')
  await updateRequest(env, id, { assigned_to: null, status: 'waiting', l1_taken_at: null })
  await addMessage(env, id, 'system', 'Обращение возвращено в общую очередь.')
  return json({ request: await requestWithClientInfo(env, id) })
}

async function handleSpecialistMessage(request, env, id) {
  const user = await specialistContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  if (item.assigned_to !== user.id && user.role !== 'admin') throw httpError(403, 'Вы не назначены на это обращение')
  if (item.status === 'done') throw httpError(409, 'Обращение завершено')

  const body = await requestBody(request)
  const text = String(body.text || '').trim()
  if (!text) throw httpError(400, 'Сообщение пустое')
  if (text.length > MAX_TEXT_LENGTH) throw httpError(400, 'Сократите сообщение до 10 000 символов')

  const msg = await addMessage(env, id, 'specialist', text)
  await updateRequest(env, id, { last_message_at: new Date().toISOString() })
  if (item.status === 'returned') {
    await updateRequest(env, id, { status: 'in_progress' })
  }
  return json({ message: msg }, 201)
}

async function handleSpecialistInternalNote(request, env, id) {
  const user = await specialistContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  if (item.assigned_to !== user.id && user.role !== 'admin') throw httpError(403, 'Вы не назначены на это обращение')

  const body = await requestBody(request)
  const text = String(body.text || '').trim()
  if (!text) throw httpError(400, 'Заметка пустая')
  if (text.length > MAX_TEXT_LENGTH) throw httpError(400, 'Сократите заметку до 10 000 символов')

  const msg = await addMessage(env, id, 'specialist', text, true)
  return json({ message: msg }, 201)
}

async function handleSpecialistNeedData(request, env, id) {
  const user = await specialistContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  if (item.assigned_to !== user.id && user.role !== 'admin') throw httpError(403, 'Вы не назначены на это обращение')
  if (item.status === 'done') throw httpError(409, 'Обращение завершено')

  const body = await requestBody(request)
  const text = String(body.text || '').trim()
  const noteText = text || 'Для продолжения работы нужны дополнительные данные от клиента.'
  await addMessage(env, id, 'specialist', noteText)
  await updateRequest(env, id, { status: 'need_data', last_message_at: new Date().toISOString() })
  return json({ request: await requestWithClientInfo(env, id) })
}

async function handleSpecialistResult(request, env, id) {
  const user = await specialistContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  if (item.assigned_to !== user.id && user.role !== 'admin') throw httpError(403, 'Вы не назначены на это обращение')
  if (item.status === 'done') throw httpError(409, 'Обращение завершено')

  const body = await requestBody(request)
  const text = String(body.text || '').trim()
  if (!text) throw httpError(400, 'Сообщение результата пусто')
  if (text.length > MAX_TEXT_LENGTH) throw httpError(400, 'Сократите сообщение до 10 000 символов')

  await addMessage(env, id, 'specialist', text)
  await updateRequest(env, id, { status: 'result_ready', result_message: text, last_message_at: new Date().toISOString() })
  await addMessage(env, id, 'system', 'Специалист передал результат. Ожидается подтверждение клиента.')
  return json({ request: await requestWithClientInfo(env, id) })
}

async function handleAdminUserRole(request, env, id) {
  await adminContext(request, env)
  const body = await requestBody(request)
  const role = String(body.role || '').trim()
  if (!['user', 'admin', 'specialist'].includes(role)) throw httpError(400, 'Допустимые роли: user, admin, specialist')
  await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, Number(id)).run()
  const updated = await findUserById(env, Number(id))
  if (!updated) throw httpError(404, 'Пользователь не найден')
  return json({ user: publicUser(updated) })
}

async function handleAdminAssign(request, env, id) {
  await adminContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  const body = await requestBody(request)
  const specialistId = body.specialist_id ? Number(body.specialist_id) : null
  if (specialistId) {
    const specialist = await findUserById(env, specialistId)
    if (!specialist) throw httpError(404, 'Специалист не найден')
    if (specialist.role !== 'specialist' && specialist.role !== 'admin') throw httpError(400, 'Пользователь не является специалистом')
    await updateRequest(env, id, { assigned_to: specialistId, status: 'in_progress', l1_taken_at: new Date().toISOString() })
    await addMessage(env, id, 'system', `Назначлен специалист: ${specialist.name || specialist.email}.`)
  } else {
    await updateRequest(env, id, { assigned_to: null, status: 'waiting', l1_taken_at: null })
    await addMessage(env, id, 'system', 'Обращение возвращено в общую очередь.')
  }
  return json({ request: await requestWithClientInfo(env, id) })
}

async function handleApi(request, env) {
  const url = new URL(request.url)
  const path = url.pathname.slice(API_PREFIX.length) || '/'
  const method = request.method.toUpperCase()

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, OPTIONS',
      },
    })
  }
  if (method === 'GET' && path === '/health') return handleHealth(env)
  if (method === 'POST' && path === '/auth/register') return handleRegister(request, env)
  if (method === 'POST' && path === '/auth/login') return handleLogin(request, env)
  if (method === 'GET' && path === '/auth/me') {
    const user = await authenticate(request, env)
    return json({ user: publicUser(user) })
  }
  if (method === 'PUT' && path === '/profile') return handleProfileUpdate(request, env)
  if (method === 'GET' && path === '/requests') return handleRequestsList(request, env)
  if (method === 'POST' && path === '/requests') return handleRequestCreate(request, env)
  if (method === 'POST' && path === '/manager/messages') return handleManagerMessage(request, env)

  let match = path.match(/^\/requests\/(\d+)$/)
  if (match && method === 'GET') return handleRequestDetail(request, env, Number(match[1]))
  match = path.match(/^\/requests\/(\d+)\/messages$/)
  if (match && method === 'POST') return handleRequestMessage(request, env, Number(match[1]))
  match = path.match(/^\/requests\/(\d+)\/assistant$/)
  if (match && method === 'POST') return handleInitialAssistantAnswer(request, env, Number(match[1]))
  match = path.match(/^\/requests\/(\d+)\/evaluate$/)
  if (match && method === 'POST') return handleRequestEvaluation(request, env, Number(match[1]))

  if (method === 'GET' && path === '/admin/stats') return handleAdminStats(request, env)
  if (method === 'GET' && path === '/admin/users') return handleAdminUsers(request, env)
  if (method === 'GET' && path === '/admin/requests') return handleAdminRequests(request, env)
  if (method === 'GET' && path === '/admin/organizations') return handleAdminOrganizations(request, env)
  if (method === 'POST' && path === '/admin/test-assistant') return handleAdminAssistantTest(request, env)

  match = path.match(/^\/admin\/requests\/(\d+)\/messages$/)
  if (match && method === 'GET') return handleAdminRequestMessages(request, env, Number(match[1]))
  if (match && method === 'POST') return handleAdminRequestMessage(request, env, Number(match[1]))
  match = path.match(/^\/admin\/requests\/(\d+)$/)
  if (match && method === 'PATCH') return handleAdminRequestUpdate(request, env, Number(match[1]))

  match = path.match(/^\/admin\/users\/(\d+)\/role$/)
  if (match && method === 'PATCH') return handleAdminUserRole(request, env, match[1])

  match = path.match(/^\/admin\/requests\/(\d+)\/assign$/)
  if (match && method === 'POST') return handleAdminAssign(request, env, Number(match[1]))

  if (method === 'GET' && path === '/specialist/queue') return handleSpecialistQueue(request, env)
  if (method === 'GET' && path === '/specialist/my-requests') return handleSpecialistMyRequests(request, env)

  match = path.match(/^\/specialist\/requests\/(\d+)$/)
  if (match && method === 'GET') return handleSpecialistRequestDetail(request, env, Number(match[1]))
  match = path.match(/^\/specialist\/requests\/(\d+)\/take$/)
  if (match && method === 'POST') return handleSpecialistTake(request, env, Number(match[1]))
  match = path.match(/^\/specialist\/requests\/(\d+)\/release$/)
  if (match && method === 'POST') return handleSpecialistRelease(request, env, Number(match[1]))
  match = path.match(/^\/specialist\/requests\/(\d+)\/messages$/)
  if (match && method === 'POST') return handleSpecialistMessage(request, env, Number(match[1]))
  match = path.match(/^\/specialist\/requests\/(\d+)\/internal-note$/)
  if (match && method === 'POST') return handleSpecialistInternalNote(request, env, Number(match[1]))
  match = path.match(/^\/specialist\/requests\/(\d+)\/need-data$/)
  if (match && method === 'POST') return handleSpecialistNeedData(request, env, Number(match[1]))
  match = path.match(/^\/specialist\/requests\/(\d+)\/result$/)
  if (match && method === 'POST') return handleSpecialistResult(request, env, Number(match[1]))

  return json({ error: 'API endpoint not found' }, 404)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith(API_PREFIX)) return env.ASSETS.fetch(request)
    try {
      if (!env.DB) throw new Error('D1 binding DB is missing')
      return await handleApi(request, env)
    } catch (error) {
      return errorResponse(error)
    }
  },
}
