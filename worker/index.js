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

function requireManager(user) {
  if (user.role !== 'manager' && user.role !== 'rof' && user.role !== 'admin') throw httpError(403, 'Доступ только для менеджера')
}

function requireRof(user) {
  if (user.role !== 'rof' && user.role !== 'admin') throw httpError(403, 'Доступ только для РОФ')
}

async function audit(env, actorId, action, entityType, entityId, details = null) {
  await env.DB.prepare(
    'INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
  ).bind(actorId || null, action, entityType || null, entityId || null, details).run()
}

async function getOrgForUser(env, userId) {
  return env.DB.prepare(`
    SELECT o.* FROM organizations o
    JOIN organization_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = ? AND ou.membership_status = 'active'
  `).bind(userId).first()
}

async function ensureOrganizationMembership(env, user) {
  const inn = String(user?.inn || '').trim()
  if (!/^\d{10}(\d{2})?$/.test(inn)) return null

  let org = await env.DB.prepare('SELECT * FROM organizations WHERE inn = ?').bind(inn).first()
  if (!org) {
    let office = await env.DB.prepare('SELECT id FROM offices WHERE is_active = 1 ORDER BY id LIMIT 1').first()
    if (!office) {
      await env.DB.prepare("INSERT INTO offices (name, code, is_active) VALUES ('Кемерово', 'KEM', 1) ON CONFLICT(code) DO NOTHING").run()
      office = await env.DB.prepare('SELECT id FROM offices WHERE code = ?').bind('KEM').first()
    }
    await env.DB.prepare(`
      INSERT INTO organizations (office_id, inn, name, service_status, last_activity_at)
      VALUES (?, ?, ?, 'unknown', CURRENT_TIMESTAMP)
      ON CONFLICT(inn) DO NOTHING
    `).bind(office.id, inn, user.organization || null).run()
    org = await env.DB.prepare('SELECT * FROM organizations WHERE inn = ?').bind(inn).first()
  }

  const existing = await env.DB.prepare('SELECT * FROM organization_users WHERE organization_id = ? AND user_id = ?').bind(org.id, user.id).first()
  if (!existing) {
    const activeMember = await env.DB.prepare("SELECT 1 AS found FROM organization_users WHERE organization_id = ? AND membership_status = 'active' LIMIT 1").bind(org.id).first()
    const membershipStatus = activeMember ? 'pending' : 'active'
    await env.DB.prepare(`
      INSERT INTO organization_users (organization_id, user_id, membership_status, approved_at)
      VALUES (?, ?, ?, CASE WHEN ? = 'active' THEN CURRENT_TIMESTAMP ELSE NULL END)
    `).bind(org.id, user.id, membershipStatus, membershipStatus).run()
  }
  return org
}

async function getManagerOrgs(env, managerId) {
  const result = await env.DB.prepare('SELECT * FROM organizations WHERE manager_id = ?').bind(managerId).all()
  return result.results || []
}

async function requireManagerContext(request, env) {
  const user = await authenticate(request, env)
  requireManager(user)
  return user
}

async function requireRofContext(request, env) {
  const user = await authenticate(request, env)
  requireRof(user)
  return user
}

async function findOrCreateConversation(env, orgId, clientUserId, managerId = null) {
  const existing = await env.DB.prepare(
    'SELECT * FROM manager_conversations WHERE organization_id = ? AND client_user_id = ?',
  ).bind(orgId, clientUserId).first()
  if (existing) {
    if (managerId != null && existing.manager_id !== managerId) {
      await env.DB.prepare('UPDATE manager_conversations SET manager_id = ? WHERE id = ?').bind(managerId, existing.id).run()
      existing.manager_id = managerId
    }
    return existing
  }
  await env.DB.prepare(
    'INSERT INTO manager_conversations (organization_id, client_user_id, manager_id) VALUES (?, ?, ?)',
  ).bind(orgId, clientUserId, managerId).run()
  return env.DB.prepare(
    'SELECT * FROM manager_conversations WHERE organization_id = ? AND client_user_id = ?',
  ).bind(orgId, clientUserId).first()
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
  const allowedKeys = ['status', 'level', 'title', 'description', 'assistant_thread_id', 'assigned_to', 'l1_transferred_at', 'l1_taken_at', 'last_message_at', 'result_message', 'manager_task_id', 'out_of_l1_reason', 'priority', 'return_count', 'result_check_method', 'organization_id', 'client_user_id']
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
  if (user.role === 'user') await ensureOrganizationMembership(env, user)
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

  const org = await ensureOrganizationMembership(env, user)
  const created = await env.DB.prepare(
    'INSERT INTO requests (user_id, title, description, organization_id, client_user_id, last_message_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
  ).bind(user.id, title, description, org?.id || null, user.id).run()
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
  const org = await ensureOrganizationMembership(env, user)
  const created = await env.DB.prepare(
    "INSERT INTO requests (user_id, title, description, status, level, l1_transferred_at, organization_id, client_user_id, last_message_at) VALUES (?, ?, ?, 'waiting', 'l1', ?, ?, ?, CURRENT_TIMESTAMP)",
  ).bind(user.id, title, text, new Date().toISOString(), org?.id || null, user.id).run()
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
      await updateRequest(env, id, { status: 'returned', return_count: (item.return_count || 0) + 1 })
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
  if (!['user', 'admin', 'specialist', 'manager', 'rof'].includes(role)) throw httpError(400, 'Допустимые роли: user, admin, specialist, manager, rof')
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

async function handleAdminCreateSpecialist(request, env) {
await adminContext(request, env)
  const body = await requestBody(request)
  const email = normalizeEmail(body.email)
  const password = String(body.password || '')
  const name = String(body.name || '').trim()
  const role = String(body.role || 'specialist').trim()
  if (!['specialist', 'manager', 'rof'].includes(role)) throw httpError(400, 'Недопустимая роль')

  if (!email || !password) throw httpError(400, 'Email и пароль обязательны')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'Некорректный email')
  if (password.length < 8) throw httpError(400, 'Пароль должен быть не короче 8 символов')
  if (await findUserByEmail(env, email)) throw httpError(409, 'Пользователь с таким email уже существует')

  const passwordHash = await hashPassword(password, passwordSecret(env))
  let result
  try {
    result = await env.DB.prepare(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    ).bind(email, passwordHash, name || 'Менеджер', role).run()
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) throw httpError(409, 'Пользователь с таким email уже существует')
    throw error
  }
  const user = await findUserById(env, result.meta.last_row_id)
  return json({ user: publicUser(user) }, 201)
}

// === MANAGER: Organizations ===

async function handleManagerDashboard(request, env) {
  const user = await requireManagerContext(request, env)
  const orgs = await getManagerOrgs(env, user.id)
  const orgIds = orgs.map(o => o.id)
  let stats = {
    myClients: orgs.length,
    unassigned: 0,
    newClients: 0,
    requireAttention: 0,
    openRequests: 0,
    notHelped: 0,
    unresolved: 0,
    newMessages: 0,
    newTasks: 0,
    noRequests: 0,
    longInactive: 0,
    frequent: 0,
    campaignReactions: 0,
    tasksNoNextStep: 0,
  }
  if (orgIds.length) {
    const placeholders = orgIds.map(() => '?').join(',')
    const [nr, na, or2, nh, ur, nm, nt, nn, ns] = await env.DB.batch([
      env.DB.prepare(`SELECT COUNT(*) AS c FROM organizations WHERE id IN (${placeholders}) AND created_at >= date('now','-7 days')`).bind(...orgIds),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM organizations WHERE id IN (${placeholders}) AND last_activity_at < date('now','-30 days')`).bind(...orgIds),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM requests WHERE organization_id IN (${placeholders}) AND status != 'done'`).bind(...orgIds),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM requests WHERE organization_id IN (${placeholders}) AND return_count > 0 AND status != 'done'`).bind(...orgIds),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM requests WHERE organization_id IN (${placeholders}) AND status NOT IN ('done','cancelled')`).bind(...orgIds),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM manager_messages m JOIN manager_conversations c ON m.conversation_id = c.id WHERE c.organization_id IN (${placeholders}) AND m.is_read = 0 AND m.sender_id != ?`).bind(...orgIds, user.id),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM manager_tasks WHERE manager_id = ? AND status = 'open'`).bind(user.id),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM organizations o WHERE o.id IN (${placeholders}) AND NOT EXISTS (SELECT 1 FROM requests r WHERE r.organization_id = o.id)`).bind(...orgIds),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM manager_tasks WHERE manager_id = ? AND status = 'open' AND (next_step IS NULL OR next_step = '')`).bind(user.id),
    ])
    stats.newClients = nr?.results?.[0]?.c || 0
    stats.longInactive = na?.results?.[0]?.c || 0
    stats.openRequests = or2?.results?.[0]?.c || 0
    stats.notHelped = nh?.results?.[0]?.c || 0
    stats.unresolved = ur?.results?.[0]?.c || 0
    stats.newMessages = nm?.results?.[0]?.c || 0
    stats.newTasks = nt?.results?.[0]?.c || 0
    stats.noRequests = nn?.results?.[0]?.c || 0
    stats.tasksNoNextStep = ns?.results?.[0]?.c || 0
  }
  const ua = await env.DB.prepare('SELECT COUNT(*) AS c FROM organizations WHERE manager_id IS NULL').first()
  stats.unassigned = ua?.c || 0
  return json({ stats, orgs })
}

async function handleManagerClients(request, env) {
  const user = await requireManagerContext(request, env)
  const url = new URL(request.url)
  const tab = url.searchParams.get('tab') || 'mine'
  let sql, params
  if (tab === 'mine') {
    sql = `SELECT o.*, (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id) AS req_count, (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status != 'done') AS open_req FROM organizations o WHERE o.manager_id = ? ORDER BY o.created_at DESC`
    params = [user.id]
  } else if (tab === 'unassigned') {
    sql = `SELECT o.*, (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id) AS req_count FROM organizations o WHERE o.manager_id IS NULL ORDER BY o.created_at DESC`
    params = []
  } else if (tab === 'new') {
    sql = `SELECT o.*, (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id) AS req_count FROM organizations o WHERE o.created_at >= date('now','-7 days') ORDER BY o.created_at DESC`
    params = []
  } else if (tab === 'attention') {
    sql = `SELECT o.*, (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.return_count > 0 AND r.status != 'done') AS open_req FROM organizations o WHERE o.manager_id = ? AND EXISTS (SELECT 1 FROM requests r WHERE r.organization_id = o.id AND r.return_count > 0 AND r.status != 'done') ORDER BY o.created_at DESC`
    params = [user.id]
  } else if (tab === 'no-requests') {
    sql = `SELECT o.* FROM organizations o WHERE o.manager_id = ? AND NOT EXISTS (SELECT 1 FROM requests r WHERE r.organization_id = o.id) ORDER BY o.created_at DESC`
    params = [user.id]
  } else if (tab === 'frequent') {
    sql = `SELECT o.*, COUNT(r.id) AS req_count FROM organizations o JOIN requests r ON r.organization_id = o.id WHERE o.manager_id = ? AND r.created_at >= date('now','-30 days') GROUP BY o.id HAVING req_count >= 3 ORDER BY req_count DESC`
    params = [user.id]
  } else if (tab === 'unresolved') {
    sql = `SELECT o.*, (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status NOT IN ('done','cancelled')) AS open_req FROM organizations o WHERE o.manager_id = ? AND EXISTS (SELECT 1 FROM requests r WHERE r.organization_id = o.id AND r.status NOT IN ('done','cancelled')) ORDER BY o.created_at DESC`
    params = [user.id]
  } else {
    sql = `SELECT o.*, (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id) AS req_count, (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status != 'done') AS open_req FROM organizations o WHERE o.manager_id = ? ORDER BY o.created_at DESC`
    params = [user.id]
  }
  const result = await env.DB.prepare(sql).bind(...params).all()
  return json({ clients: result.results || [] })
}

async function handleOrgDetail(request, env, id) {
  const user = await requireManagerContext(request, env)
  const org = await env.DB.prepare(`
    SELECT o.*, m.name AS manager_name, m.email AS manager_email
    FROM organizations o LEFT JOIN users m ON o.manager_id = m.id
    WHERE o.id = ?
  `).bind(id).first()
  if (!org) throw httpError(404, 'Организация не найдена')
  if (user.role === 'manager' && org.manager_id !== user.id) throw httpError(403, 'Это не ваш клиент')

  const usersResult = await env.DB.prepare(`
    SELECT u.id, u.email, u.name, ou.membership_status, u.created_at,
      (SELECT COUNT(*) FROM requests r WHERE r.user_id = u.id) AS req_count
    FROM organization_users ou
    JOIN users u ON ou.user_id = u.id
    WHERE ou.organization_id = ?
  `).bind(id).all()

  const reqResult = await env.DB.prepare(`
    SELECT r.*, u.name AS client_name, u.email AS client_email
    FROM requests r JOIN users u ON r.user_id = u.id
    WHERE r.organization_id = ?
    ORDER BY r.created_at DESC
  `).bind(id).all()

  const tasksResult = await env.DB.prepare(`
    SELECT * FROM manager_tasks WHERE organization_id = ? ORDER BY created_at DESC
  `).bind(id).all()

  return json({ org, users: usersResult.results || [], requests: reqResult.results || [], tasks: tasksResult.results || [] })
}

async function handleAssignOrg(request, env, id) {
  const user = await requireManagerContext(request, env)
  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(id).first()
  if (!org) throw httpError(404, 'Организация не найдена')

  if (user.role === 'manager') {
    if (org.manager_id !== null) throw httpError(409, 'У организации уже есть менеджер')
    const result = await env.DB.prepare('UPDATE organizations SET manager_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND manager_id IS NULL').bind(user.id, id).run()
    if (!result.meta.changes) throw httpError(409, 'Организация уже закреплена за другим менеджером')
    await env.DB.prepare('UPDATE manager_conversations SET manager_id = ? WHERE organization_id = ?').bind(user.id, id).run()
    await env.DB.prepare('INSERT INTO client_assignments (organization_id, previous_manager_id, new_manager_id, changed_by, reason) VALUES (?, ?, ?, ?, ?)').bind(id, org.manager_id, user.id, user.id, 'Забрал себе').run()
    await audit(env, user.id, 'assign_manager', 'organization', id, `Менеджер ${user.id} забрал организацию`)
  } else {
    const body = await requestBody(request)
    const newManagerId = body.manager_id ? Number(body.manager_id) : null
    if (!newManagerId) throw httpError(400, 'Укажите manager_id')
    const specialist = await findUserById(env, newManagerId)
    if (!specialist) throw httpError(404, 'Менеджер не найден')
    if (specialist.role !== 'manager' && specialist.role !== 'rof' && specialist.role !== 'admin') throw httpError(400, 'Пользователь не является менеджером')
    await env.DB.prepare('UPDATE organizations SET manager_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newManagerId, id).run()
    await env.DB.prepare('UPDATE manager_conversations SET manager_id = ? WHERE organization_id = ?').bind(newManagerId, id).run()
    await env.DB.prepare('INSERT INTO client_assignments (organization_id, previous_manager_id, new_manager_id, changed_by, reason) VALUES (?, ?, ?, ?, ?)').bind(id, org.manager_id, newManagerId, user.id, body.reason || 'Назначение РОФ').run()
    await audit(env, user.id, 'assign_manager', 'organization', id, `РОФ назначил менеджера ${newManagerId}`)
  }
  return json({ ok: true })
}

async function handleUnassignOrg(request, env, id) {
  const user = await requireRofContext(request, env)
  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(id).first()
  if (!org) throw httpError(404, 'Организация не найдена')
  await env.DB.prepare('UPDATE organizations SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run()
  await env.DB.prepare('UPDATE manager_conversations SET manager_id = NULL WHERE organization_id = ?').bind(id).run()
  await env.DB.prepare('INSERT INTO client_assignments (organization_id, previous_manager_id, new_manager_id, changed_by, reason) VALUES (?, ?, NULL, ?, ?)').bind(id, org.manager_id, user.id, 'Снято РОФ').run()
  await audit(env, user.id, 'unassign_manager', 'organization', id, 'Снятие менеджера')
  return json({ ok: true })
}

async function handleServiceStatusUpdate(request, env, id) {
  const user = await requireManagerContext(request, env)
  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(id).first()
  if (!org) throw httpError(404, 'Организация не найдена')
  if (user.role === 'manager' && org.manager_id !== user.id) throw httpError(403, 'Это не ваш клиент')
  const body = await requestBody(request)
  const status = String(body.service_status || '').trim()
  if (!['unknown', 'its_prof', 'fresh_prof', 'other_regular', 'no_regular_contract'].includes(status)) throw httpError(400, 'Недопустимый статус')
  await env.DB.prepare('UPDATE organizations SET service_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, id).run()
  await audit(env, user.id, 'change_service_status', 'organization', id, `Статус: ${status}`)
  return json({ ok: true })
}

async function handlePendingUsers(request, env) {
  const user = await requireManagerContext(request, env)
  let result
  if (user.role === 'manager') {
    result = await env.DB.prepare(`
      SELECT ou.*, u.email, u.name, u.inn, o.name AS org_name, o.inn AS org_inn
      FROM organization_users ou
      JOIN users u ON ou.user_id = u.id
      JOIN organizations o ON ou.organization_id = o.id
      WHERE ou.membership_status = 'pending' AND o.manager_id = ?
      ORDER BY ou.created_at DESC
    `).bind(user.id).all()
  } else {
    result = await env.DB.prepare(`
      SELECT ou.*, u.email, u.name, u.inn, o.name AS org_name, o.inn AS org_inn
      FROM organization_users ou
      JOIN users u ON ou.user_id = u.id
      JOIN organizations o ON ou.organization_id = o.id
      WHERE ou.membership_status = 'pending'
      ORDER BY ou.created_at DESC
    `).all()
  }
  return json({ pending: result.results || [] })
}

async function handleApproveUser(request, env) {
  const user = await requireManagerContext(request, env)
  const body = await requestBody(request)
  const orgId = Number(body.organization_id)
  const userId = Number(body.user_id)
  const action = String(body.action || '').trim()
  if (!['active', 'rejected'].includes(action)) throw httpError(400, 'Допустимые действия: active, rejected')

  const org = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first()
  if (!org) throw httpError(404, 'Организация не найдена')
  if (user.role === 'manager' && org.manager_id !== user.id) throw httpError(403, 'Это не ваш клиент')

  await env.DB.prepare('UPDATE organization_users SET membership_status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE organization_id = ? AND user_id = ?').bind(action, user.id, orgId, userId).run()
  await audit(env, user.id, 'approve_user', 'organization', orgId, `Пользователь ${userId}: ${action}`)
  return json({ ok: true })
}

async function handleClientChatList(request, env) {
  const user = await authenticate(request, env)
  if (user.role === 'user') {
    const org = await getOrgForUser(env, user.id)
    if (!org) return json({ conversations: [], org: null })
    const conv = await env.DB.prepare(`
      SELECT c.*, m.name AS manager_name, m.email AS manager_email,
        (SELECT COUNT(*) FROM manager_messages WHERE conversation_id = c.id AND is_read = 0 AND sender_id != ?) AS unread
      FROM manager_conversations c LEFT JOIN users m ON c.manager_id = m.id
      WHERE c.client_user_id = ?
    `).bind(user.id, user.id).all()
    return json({ conversations: conv.results || [], org })
  }
  if (user.role === 'manager') {
    const result = await env.DB.prepare(`
      SELECT c.*, o.name AS org_name, o.inn AS org_inn, u.name AS client_name, u.email AS client_email,
        (SELECT COUNT(*) FROM manager_messages WHERE conversation_id = c.id AND is_read = 0 AND sender_id != ?) AS unread
      FROM manager_conversations c
      JOIN organizations o ON c.organization_id = o.id
      JOIN users u ON c.client_user_id = u.id
      WHERE o.manager_id = ?
      ORDER BY c.created_at DESC
    `).bind(user.id, user.id).all()
    return json({ conversations: result.results || [] })
  }
  if (user.role === 'rof' || user.role === 'admin') {
    const result = await env.DB.prepare(`
      SELECT c.*, o.name AS org_name, o.inn AS org_inn, u.name AS client_name, u.email AS client_email,
        m.name AS manager_name,
        (SELECT COUNT(*) FROM manager_messages WHERE conversation_id = c.id AND is_read = 0 AND sender_id != ?) AS unread
      FROM manager_conversations c
      JOIN organizations o ON c.organization_id = o.id
      JOIN users u ON c.client_user_id = u.id
      LEFT JOIN users m ON c.manager_id = m.id
      ORDER BY c.created_at DESC
    `).bind(user.id).all()
    return json({ conversations: result.results || [] })
  }
  if (user.role === 'specialist') {
    const result = await env.DB.prepare(`
      SELECT c.*, o.name AS org_name, o.inn AS org_inn, u.name AS client_name, u.email AS client_email,
        m.name AS manager_name,
        (SELECT COUNT(*) FROM manager_messages WHERE conversation_id = c.id AND is_read = 0 AND sender_id != ?) AS unread
      FROM manager_conversations c
      JOIN organizations o ON c.organization_id = o.id
      JOIN users u ON c.client_user_id = u.id
      LEFT JOIN users m ON c.manager_id = m.id
      WHERE c.organization_id IN (SELECT organization_id FROM requests WHERE assigned_to = ?)
      ORDER BY c.created_at DESC
    `).bind(user.id, user.id).all()
    return json({ conversations: result.results || [] })
  }
  return json({ conversations: [] })
}

async function handleClientChatMessages(request, env, convId) {
  const user = await authenticate(request, env)
  const conv = await env.DB.prepare(`
    SELECT c.*, o.manager_id AS current_manager_id
    FROM manager_conversations c
    JOIN organizations o ON o.id = c.organization_id
    WHERE c.id = ?
  `).bind(convId).first()
  if (!conv) throw httpError(404, 'Чат не найден')
  if (user.role === 'user' && conv.client_user_id !== user.id) throw httpError(403, 'Нет доступа')
  if (user.role === 'manager' && conv.current_manager_id !== user.id) throw httpError(403, 'Нет доступа')
  const result = await env.DB.prepare(`
    SELECT m.*, u.name AS sender_name
    FROM manager_messages m LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ? ORDER BY m.created_at ASC, m.id ASC
  `).bind(convId).all()
  if (user.role !== 'specialist') {
    await env.DB.prepare('UPDATE manager_messages SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND sender_id != ? AND is_read = 0').bind(convId, user.id).run()
  }
  return json({ conversation: conv, messages: result.results || [] })
}

async function handleClientChatSend(request, env) {
  const user = await authenticate(request, env)
  const body = await requestBody(request)
  const text = String(body.text || '').trim()
  if (!text) throw httpError(400, 'Сообщение пусто')
  if (text.length > MAX_TEXT_LENGTH) throw httpError(400, 'Слишком длинно')

let convId
  if (user.role === 'user') {
    const org = await getOrgForUser(env, user.id)
    if (!org) throw httpError(400, 'Организация не определена')
    const conv = await findOrCreateConversation(env, org.id, user.id, org.manager_id)
    convId = conv.id
  } else if (body.conversation_id) {
    convId = Number(body.conversation_id)
    const conv = await env.DB.prepare(`
      SELECT c.*, o.manager_id AS current_manager_id
      FROM manager_conversations c
      JOIN organizations o ON o.id = c.organization_id
      WHERE c.id = ?
    `).bind(convId).first()
    if (!conv) throw httpError(404, 'Чат не найден')
    if (user.role === 'manager' && conv.current_manager_id !== user.id) throw httpError(403, 'Нет доступа')
    if (conv.current_manager_id != null && conv.manager_id !== conv.current_manager_id) {
      await env.DB.prepare('UPDATE manager_conversations SET manager_id = ? WHERE id = ?').bind(conv.current_manager_id, conv.id).run()
    }
  } else if (body.client_user_id) {
    const clientUserId = Number(body.client_user_id)
    const clientUser = await findUserById(env, clientUserId)
    if (!clientUser) throw httpError(404, 'Клиент не найден')
    const org = await getOrgForUser(env, clientUserId)
    if (!org) throw httpError(400, 'У клиента нет организации')
    if (user.role === 'manager') {
      if (org.manager_id !== user.id) throw httpError(403, 'Это не ваш клиент')
    }
    const conv = await findOrCreateConversation(env, org.id, clientUserId, org.manager_id)
    convId = conv.id
  } else {
    throw httpError(400, 'Укажите conversation_id или client_user_id')
  }

  const result = await env.DB.prepare('INSERT INTO manager_messages (conversation_id, sender_id, text) VALUES (?, ?, ?)').bind(convId, user.id, text).run()
  await env.DB.prepare('UPDATE organizations SET last_activity_at = CURRENT_TIMESTAMP WHERE id = (SELECT organization_id FROM manager_conversations WHERE id = ?)').bind(convId).run()
  return json({ message: { id: result.meta.last_row_id, conversation_id: convId, sender_id: user.id, text } }, 201)
}

async function handleSpecialistClientChat(request, env) {
  await specialistContext(request, env)
  const url = new URL(request.url)
  const userId = Number(url.searchParams.get('user_id') || 0)
  if (!userId) throw httpError(400, 'Укажите user_id')
  const conv = await env.DB.prepare(`
    SELECT c.*, m.name AS manager_name
    FROM manager_conversations c LEFT JOIN users m ON c.manager_id = m.id
    WHERE c.client_user_id = ?
  `).bind(userId).first()
  if (!conv) return json({ conversation: null, messages: [] })
  const result = await env.DB.prepare(`
    SELECT m.*, u.name AS sender_name
    FROM manager_messages m LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ? ORDER BY m.created_at ASC, m.id ASC
  `).bind(conv.id).all()
  return json({ conversation: conv, messages: result.results || [] })
}

async function handleCampaignList(request, env) {
  const user = await requireManagerContext(request, env)
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  let sql = `
    SELECT c.*, u.name AS author_name, COUNT(ct.organization_id) AS target_count
    FROM campaigns c
    JOIN users u ON c.author_id = u.id
    LEFT JOIN campaign_targets ct ON ct.campaign_id = c.id
  `
  const conditions = []
  const params = []
  if (user.role === 'manager') { conditions.push('c.author_id = ?'); params.push(user.id) }
  if (status) { conditions.push('c.status = ?'); params.push(status) }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`
  sql += ' GROUP BY c.id ORDER BY c.created_at DESC'
  const result = params.length ? await env.DB.prepare(sql).bind(...params).all() : await env.DB.prepare(sql).all()
  return json({ campaigns: result.results || [] })
}

async function handleCampaignCreate(request, env) {
  const user = await requireManagerContext(request, env)
  const body = await requestBody(request)
  const title = String(body.title || '').trim()
  const fullText = String(body.full_text || '').trim()
  if (!title || !fullText) throw httpError(400, 'Заголовок и текст обязательны')
  const defaultTargetMode = user.role === 'manager' ? 'all_my' : 'all_system'
  const targetMode = String(body.target_mode || defaultTargetMode).trim()
  if (!['all_my', 'all_system', 'selected'].includes(targetMode)) throw httpError(400, 'Недопустимый тип аудитории')
  if (user.role === 'manager' && targetMode === 'all_system') throw httpError(403, 'Менеджер может отправлять акции только своим клиентам')
  const targetOrgIds = [...new Set((Array.isArray(body.target_org_ids) ? body.target_org_ids : []).map(Number).filter(Number.isInteger))]
  if (targetMode === 'selected' && !targetOrgIds.length) throw httpError(400, 'Выберите хотя бы одну организацию')

  if (targetMode === 'selected') {
    const placeholders = targetOrgIds.map(() => '?').join(',')
    let accessSql = `SELECT id FROM organizations WHERE id IN (${placeholders})`
    const accessParams = [...targetOrgIds]
    if (user.role === 'manager') { accessSql += ' AND manager_id = ?'; accessParams.push(user.id) }
    const allowed = await env.DB.prepare(accessSql).bind(...accessParams).all()
    if ((allowed.results || []).length !== targetOrgIds.length) throw httpError(403, 'В аудитории есть недоступные организации')
  }
  const result = await env.DB.prepare(`
    INSERT INTO campaigns (office_id, author_id, title, subject, short_text, full_text, category, action_type, action_label, start_date, end_date, status, target_status, target_mode)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
  `).bind(user.id, title, body.subject || null, body.short_text || null, fullText, body.category || 'promo', body.action_type || null, body.action_label || null, body.start_date || null, body.end_date || null, body.target_status || 'all', targetMode).run()
  if (targetMode === 'selected') {
    for (const orgId of targetOrgIds) {
      await env.DB.prepare('INSERT INTO campaign_targets (campaign_id, organization_id) VALUES (?, ?)').bind(result.meta.last_row_id, orgId).run()
    }
  }
  await audit(env, user.id, 'create_campaign', 'campaign', result.meta.last_row_id, title)
  return json({ id: result.meta.last_row_id }, 201)
}

async function handleCampaignActivate(request, env, id) {
  const user = await requireManagerContext(request, env)
  const campaign = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first()
  if (!campaign) throw httpError(404, 'Кампания не найдена')
  if (user.role === 'manager' && campaign.author_id !== user.id) throw httpError(403, 'Можно запускать только свои кампании')
  if (campaign.status === 'active') throw httpError(409, 'Кампания уже запущена')
  let sql = `SELECT o.id AS org_id, u.id AS user_id FROM organizations o JOIN organization_users ou ON o.id = ou.organization_id JOIN users u ON ou.user_id = u.id WHERE ou.membership_status = 'active'`
  const params = []
  const targetMode = campaign.target_mode || (user.role === 'manager' ? 'all_my' : 'all_system')
  if (targetMode === 'selected') {
    sql += ' AND o.id IN (SELECT organization_id FROM campaign_targets WHERE campaign_id = ?)'
    params.push(id)
  } else if (targetMode === 'all_my') {
    sql += ' AND o.manager_id = ?'
    params.push(campaign.author_id)
  } else if (targetMode === 'all_system' && user.role === 'manager') {
    throw httpError(403, 'Менеджер не может запускать рассылку по всем организациям')
  }
  if (campaign.target_status === 'no_regular_contract') { sql += ' AND o.service_status = ?'; params.push('no_regular_contract') }
  else if (campaign.target_status && !['unknown', 'all'].includes(campaign.target_status)) { sql += ' AND o.service_status = ?'; params.push(campaign.target_status) }
  const targets = await env.DB.prepare(sql).bind(...params).all()
  if (!(targets.results || []).length) throw httpError(400, 'В выбранной аудитории нет активных клиентов')
  let count = 0
  for (const t of targets.results || []) {
    const delivery = await env.DB.prepare('INSERT OR IGNORE INTO campaign_deliveries (campaign_id, organization_id, user_id, delivered_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').bind(id, t.org_id, t.user_id).run()
    count += delivery.meta.changes || 0
  }
  await env.DB.prepare("UPDATE campaigns SET status = 'active' WHERE id = ?").bind(id).run()
  await audit(env, user.id, 'activate_campaign', 'campaign', id, `Доставлено: ${count}`)
  return json({ delivered: count })
}

async function handleCampaignDeliveries(request, env, id) {
  const user = await requireManagerContext(request, env)
  const campaign = await env.DB.prepare('SELECT author_id FROM campaigns WHERE id = ?').bind(id).first()
  if (!campaign) throw httpError(404, 'Кампания не найдена')
  if (user.role === 'manager' && campaign.author_id !== user.id) throw httpError(403, 'Нет доступа к этой кампании')
  const result = await env.DB.prepare(`
    SELECT d.*, o.inn AS org_inn, o.name AS org_name, u.name AS user_name, u.email AS user_email
    FROM campaign_deliveries d
    JOIN organizations o ON d.organization_id = o.id
    JOIN users u ON d.user_id = u.id
    WHERE d.campaign_id = ?
    ORDER BY d.created_at DESC
  `).bind(id).all()
  return json({ deliveries: result.results || [] })
}

async function handleNotifications(request, env) {
  const user = await authenticate(request, env)
  if (user.role !== 'user') throw httpError(403, 'Только для клиентов')
  const [chatMessages, campaigns] = await env.DB.batch([
    env.DB.prepare(`
      SELECT m.id, m.text, m.created_at, m.is_read, c.id AS conversation_id,
        COALESCE(s.name, s.email, 'Менеджер') AS sender_name
      FROM manager_messages m
      JOIN manager_conversations c ON c.id = m.conversation_id
      LEFT JOIN users s ON s.id = m.sender_id
      WHERE c.client_user_id = ? AND m.sender_id != ?
      ORDER BY m.created_at DESC, m.id DESC LIMIT 30
    `).bind(user.id, user.id),
    env.DB.prepare(`
      SELECT d.id, d.campaign_id, d.opened_at, d.delivered_at, c.title, c.short_text
      FROM campaign_deliveries d
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE d.user_id = ? AND d.hidden = 0 AND c.status = 'active'
      ORDER BY d.delivered_at DESC, d.id DESC LIMIT 30
    `).bind(user.id),
  ])
  const messageItems = (chatMessages.results || []).map(item => ({
    type: 'manager_message',
    id: item.id,
    conversation_id: item.conversation_id,
    title: `Сообщение от ${item.sender_name}`,
    description: item.text,
    created_at: item.created_at,
    unread: !item.is_read,
  }))
  const campaignItems = (campaigns.results || []).map(item => ({
    type: 'campaign',
    id: item.id,
    campaign_id: item.campaign_id,
    title: `Новая акция: ${item.title}`,
    description: item.short_text || 'Откройте раздел «Важное для вас»',
    created_at: item.delivered_at,
    unread: !item.opened_at,
  }))
  const items = [...messageItems, ...campaignItems]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 40)
  return json({
    items,
    unread_messages: messageItems.filter(item => item.unread).length,
    unread_campaigns: campaignItems.filter(item => item.unread).length,
    unread_count: items.filter(item => item.unread).length,
  })
}

async function handleClientFeed(request, env) {
  const user = await authenticate(request, env)
  if (user.role !== 'user') throw httpError(403, 'Только для клиентов')
  const result = await env.DB.prepare(`
    SELECT d.id, d.campaign_id, c.title, c.subject, c.short_text, c.full_text, c.category,
      c.action_type, c.action_label, c.start_date, c.end_date, d.hidden,
      u.name AS author_name, d.opened_at, d.clicked_at
    FROM campaign_deliveries d
    JOIN campaigns c ON d.campaign_id = c.id
    JOIN users u ON c.author_id = u.id
    WHERE d.user_id = ? AND d.hidden = 0 AND c.status = 'active'
    ORDER BY d.delivered_at DESC
  `).bind(user.id).all()
  return json({ items: result.results || [] })
}

async function handleFeedAction(request, env, deliveryId) {
  const user = await authenticate(request, env)
  if (user.role !== 'user') throw httpError(403, 'Только для клиентов')
  const body = await requestBody(request)
  const action = String(body.action || '').trim()
  if (action === 'open') {
    await env.DB.prepare('UPDATE campaign_deliveries SET opened_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').bind(deliveryId, user.id).run()
  } else if (action === 'click') {
    await env.DB.prepare('UPDATE campaign_deliveries SET clicked_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').bind(deliveryId, user.id).run()
  } else if (action === 'hide') {
    await env.DB.prepare('UPDATE campaign_deliveries SET hidden = 1 WHERE id = ? AND user_id = ?').bind(deliveryId, user.id).run()
  } else if (action === 'manager') {
    const delivery = await env.DB.prepare('SELECT * FROM campaign_deliveries WHERE id = ? AND user_id = ?').bind(deliveryId, user.id).first()
    if (!delivery) throw httpError(404, 'Материал не найден')
    const org = await getOrgForUser(env, user.id)
    if (org) {
      const conv = await findOrCreateConversation(env, org.id, user.id, org.manager_id)
      const camp = await env.DB.prepare('SELECT title FROM campaigns WHERE id = ?').bind(delivery.campaign_id).first()
      await env.DB.prepare('INSERT INTO manager_messages (conversation_id, sender_id, text) VALUES (?, ?, ?)').bind(conv.id, user.id, `Интересует материал: ${camp?.title || ''}`).run()
    }
    await env.DB.prepare('UPDATE campaign_deliveries SET clicked_at = CURRENT_TIMESTAMP WHERE id = ?').bind(deliveryId).run()
  }
  return json({ ok: true })
}

async function handleManagerTasks(request, env) {
  const user = await requireManagerContext(request, env)
  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'open'
  const result = await env.DB.prepare(`
    SELECT t.*, o.inn AS org_inn, o.name AS org_name, u.name AS client_name, u.email AS client_email
    FROM manager_tasks t
    LEFT JOIN organizations o ON t.organization_id = o.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.manager_id = ? AND t.status = ?
    ORDER BY t.created_at DESC
  `).bind(user.id, status).all()
  return json({ tasks: result.results || [] })
}

async function handleTaskUpdate(request, env, id) {
  const user = await requireManagerContext(request, env)
  const task = await env.DB.prepare('SELECT * FROM manager_tasks WHERE id = ?').bind(id).first()
  if (!task) throw httpError(404, 'Задача не найдена')
  if (user.role === 'manager' && task.manager_id !== user.id) throw httpError(403, 'Не ваша задача')
  const body = await requestBody(request)
  const updates = {}
  if (body.status && ['open', 'in_progress', 'done', 'cancelled'].includes(body.status)) updates.status = body.status
  if (body.next_step !== undefined) updates.next_step = String(body.next_step || '').trim()
  if (body.next_step_date !== undefined) updates.next_step_date = body.next_step_date || null
  if (body.result !== undefined) { updates.result = String(body.result || '').trim(); updates.result_at = new Date().toISOString() }
  if (Object.keys(updates).length) {
    const assignments = Object.keys(updates).map(k => `${k} = ?`).join(', ')
    await env.DB.prepare(`UPDATE manager_tasks SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...Object.values(updates), id).run()
  }
  return json({ ok: true })
}

async function handleSpecialistTransferToManager(request, env, id) {
  const user = await specialistContext(request, env)
  const item = await getAnyRequest(env, id)
  if (!item) throw httpError(404, 'Обращение не найдено')
  if (item.assigned_to !== user.id && user.role !== 'admin') throw httpError(403, 'Вы не назначены на это обращение')
  if (item.status === 'done') throw httpError(409, 'Обращение завершено')

  const body = await requestBody(request)
  const reason = String(body.reason || '').trim()
  const diagnosis = String(body.diagnosis || '').trim()
  const expectedResult = String(body.expected_result || '').trim()
  const priority = String(body.priority || 'normal').trim()
  if (!reason) throw httpError(400, 'Укажите причину выхода за границы L1')

  const org = item.organization_id ? await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(item.organization_id).first() : null
  const managerId = org?.manager_id || null

  const taskResult = await env.DB.prepare(`
    INSERT INTO manager_tasks (organization_id, user_id, manager_id, source, source_request_id, description, diagnosis, expected_result, priority, status)
    VALUES (?, ?, ?, 'l1_transfer', ?, ?, ?, ?, ?, 'open')
  `).bind(item.organization_id || null, item.user_id, managerId, item.id, reason, diagnosis, expectedResult, ['normal','high','critical'].includes(priority) ? priority : 'normal').run()
  const taskId = taskResult.meta.last_row_id

  await updateRequest(env, id, { status: 'manager_action', manager_task_id: taskId, out_of_l1_reason: reason })
  await addMessage(env, id, 'system', 'Обращение передано менеджеру. Менеджер свяжется с вами по следующему шагу.')
  await audit(env, user.id, 'l1_transfer', 'request', id, `Задача ${taskId}`)
  return json({ task_id: taskId, request: await requestWithClientInfo(env, id) })
}

async function handleRofDashboard(request, env) {
  await requireRofContext(request, env)
  const [orgs, mgrs, unassigned, openReq, notHelped, l1Queue, tasks] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS c FROM organizations'),
    env.DB.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'manager'"),
    env.DB.prepare('SELECT COUNT(*) AS c FROM organizations WHERE manager_id IS NULL'),
    env.DB.prepare("SELECT COUNT(*) AS c FROM requests WHERE status != 'done' AND status != 'cancelled'"),
    env.DB.prepare("SELECT COUNT(*) AS c FROM requests WHERE return_count > 0 AND status != 'done'"),
    env.DB.prepare("SELECT COUNT(*) AS c FROM requests WHERE level = 'l1' AND status = 'waiting'"),
    env.DB.prepare("SELECT COUNT(*) AS c FROM manager_tasks WHERE status = 'open'"),
  ])
  const managers = await env.DB.prepare(`
    SELECT u.id, u.name, u.email,
      (SELECT COUNT(*) FROM organizations o WHERE o.manager_id = u.id) AS client_count,
      (SELECT COUNT(*) FROM manager_tasks t WHERE t.manager_id = u.id AND t.status = 'open') AS open_tasks,
      (SELECT COUNT(*) FROM requests r JOIN organizations o ON r.organization_id = o.id WHERE o.manager_id = u.id AND r.status != 'done') AS open_requests
    FROM users u WHERE u.role = 'manager'
  `).all()
  return json({
    stats: {
      orgs: orgs?.results?.[0]?.c || 0,
      managers: mgrs?.results?.[0]?.c || 0,
      unassigned: unassigned?.results?.[0]?.c || 0,
      openRequests: openReq?.results?.[0]?.c || 0,
      notHelped: notHelped?.results?.[0]?.c || 0,
      l1Queue: l1Queue?.results?.[0]?.c || 0,
      openTasks: tasks?.results?.[0]?.c || 0,
    },
    managers: managers.results || [],
  })
}

async function handleRofClients(request, env) {
  await requireRofContext(request, env)
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  let sql = `
    SELECT o.*, m.name AS manager_name,
      (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id) AS req_count,
      (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status != 'done') AS open_req
    FROM organizations o LEFT JOIN users m ON o.manager_id = m.id
  `
  const params = []
  if (search.trim()) {
    sql += ' WHERE o.inn LIKE ? OR o.name LIKE ?'
    const p = `%${search.trim()}%`
    params.push(p, p)
  }
  sql += ' ORDER BY o.created_at DESC'
  const result = params.length ? await env.DB.prepare(sql).bind(...params).all() : await env.DB.prepare(sql).all()
  return json({ clients: result.results || [] })
}

async function handleRofL1Queue(request, env) {
  await requireRofContext(request, env)
  const url = new URL(request.url)
  const filter = url.searchParams.get('filter') || 'all'
  const filters = {
    'waiting': "r.status = 'waiting'",
    'in-progress': "r.status = 'in_progress'",
    'need-data': "r.status = 'need_data'",
    'result-ready': "r.status = 'result_ready'",
    'returned': "r.status = 'returned'",
    'manager-action': "r.status = 'manager_action'",
    'all': "1=1",
  }
  const sql = `
    SELECT r.*, u.email AS client_email, u.name AS client_name, u.inn AS client_inn,
      s.name AS specialist_name, o.name AS org_name
    FROM requests r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN users s ON r.assigned_to = s.id
    LEFT JOIN organizations o ON r.organization_id = o.id
    WHERE r.level = 'l1' AND (${filters[filter] || filters.all})
    ORDER BY r.created_at DESC
  `
  const result = await env.DB.prepare(sql).all()
  return json({ requests: result.results || [] })
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
  if (method === 'POST' && path === '/admin/specialists') return handleAdminCreateSpecialist(request, env)

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
  match = path.match(/^\/specialist\/requests\/(\d+)\/transfer-to-manager$/)
  if (match && method === 'POST') return handleSpecialistTransferToManager(request, env, Number(match[1]))

  if (method === 'GET' && path === '/specialist/client-chat') return handleSpecialistClientChat(request, env)

  // Manager routes
  if (method === 'GET' && path === '/manager/dashboard') return handleManagerDashboard(request, env)
  if (method === 'GET' && path === '/manager/clients') return handleManagerClients(request, env)
  if (method === 'GET' && path === '/manager/pending-users') return handlePendingUsers(request, env)
  if (method === 'POST' && path === '/manager/approve-user') return handleApproveUser(request, env)
  if (method === 'GET' && path === '/manager/tasks') return handleManagerTasks(request, env)

  match = path.match(/^\/manager\/orgs\/(\d+)$/)
  if (match && method === 'GET') return handleOrgDetail(request, env, Number(match[1]))
  match = path.match(/^\/manager\/orgs\/(\d+)\/assign$/)
  if (match && method === 'POST') return handleAssignOrg(request, env, Number(match[1]))
  match = path.match(/^\/manager\/orgs\/(\d+)\/unassign$/)
  if (match && method === 'POST') return handleUnassignOrg(request, env, Number(match[1]))
  match = path.match(/^\/manager\/orgs\/(\d+)\/service-status$/)
  if (match && method === 'POST') return handleServiceStatusUpdate(request, env, Number(match[1]))
  match = path.match(/^\/manager\/tasks\/(\d+)$/)
  if (match && method === 'POST') return handleTaskUpdate(request, env, Number(match[1]))

  // Manager chat
  if (method === 'GET' && path === '/chat/list') return handleClientChatList(request, env)
  if (method === 'POST' && path === '/chat/send') return handleClientChatSend(request, env)
  match = path.match(/^\/chat\/(\d+)\/messages$/)
  if (match && method === 'GET') return handleClientChatMessages(request, env, Number(match[1]))

  if (method === 'GET' && path === '/notifications') return handleNotifications(request, env)

  // Campaigns
  if (method === 'GET' && path === '/campaigns') return handleCampaignList(request, env)
  if (method === 'POST' && path === '/campaigns') return handleCampaignCreate(request, env)
  match = path.match(/^\/campaigns\/(\d+)\/deliveries$/)
  if (match && method === 'GET') return handleCampaignDeliveries(request, env, Number(match[1]))
  match = path.match(/^\/campaigns\/(\d+)\/activate$/)
  if (match && method === 'POST') return handleCampaignActivate(request, env, Number(match[1]))

  // Client feed
  if (method === 'GET' && path === '/feed') return handleClientFeed(request, env)
  match = path.match(/^\/feed\/(\d+)\/action$/)
  if (match && method === 'POST') return handleFeedAction(request, env, Number(match[1]))

  // ROF routes
  if (method === 'GET' && path === '/rof/dashboard') return handleRofDashboard(request, env)
  if (method === 'GET' && path === '/rof/clients') return handleRofClients(request, env)
  if (method === 'GET' && path === '/rof/l1-queue') return handleRofL1Queue(request, env)

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
