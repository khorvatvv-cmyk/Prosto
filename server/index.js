import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import {
  createUser, findUserByEmail, findUserById,
  createRequest, getRequestsByUserId, getRequestById, updateRequest,
  addMessage, getMessagesByRequestId,
  getAllUsers, getAllRequests, getOrganizations, getStats,
} from './db.js'
import { askAssistant, isAssistantConfigured } from './assistant.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3001
const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'local-development-only-secret'
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const isProduction = process.env.NODE_ENV === 'production'
const startedAt = new Date()

if (isProduction && !process.env.JWT_SECRET?.trim()) {
  throw new Error('JWT_SECRET is required in production')
}

const configuredOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use(cors({
  origin: configuredOrigins?.length ? configuredOrigins : true,
  credentials: false,
}))
app.use(express.json({ limit: '1mb' }))
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, max-age=0')
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    assistant: isAssistantConfigured() ? 'configured' : 'not_configured',
    database: 'ok',
    uptime: Math.round(process.uptime()),
    startedAt: startedAt.toISOString(),
    time: new Date().toISOString(),
  })
})

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Нет токена' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = findUserById(payload.userId)
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' })
    req.userId = user.id
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Неверный токен' })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ только для администратора' })
  }
  next()
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    inn: user.inn,
    name: user.name,
    organization: user.organization,
    role: user.role || 'user',
  }
}

function signUser(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
}

app.post('/api/auth/register', (req, res) => {
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')
  const inn = String(req.body.inn || '').trim()
  const name = String(req.body.name || '').trim()

  if (!email || !password || !inn) {
    return res.status(400).json({ error: 'Email, пароль и ИНН обязательны' })
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Укажите корректный email' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен содержать не менее 8 символов' })
  }
  if (!/^\d{10}(\d{2})?$/.test(inn)) {
    return res.status(400).json({ error: 'ИНН должен содержать 10 или 12 цифр' })
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'Пользователь с таким email уже существует' })
  }

  createUser({
    email,
    password,
    inn,
    name,
    role: ADMIN_EMAIL && email === ADMIN_EMAIL ? 'admin' : 'user',
  })
  const user = findUserByEmail(email)
  if (!user) return res.status(500).json({ error: 'Ошибка создания пользователя' })

  res.status(201).json({ token: signUser(user), user: publicUser(user) })
})

app.post('/api/auth/login', (req, res) => {
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')
  if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' })

  const user = findUserByEmail(email)
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Неверный email или пароль' })
  }

  res.json({ token: signUser(user), user: publicUser(user) })
})

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.get('/api/requests', auth, (req, res) => {
  res.json({ requests: getRequestsByUserId(req.userId) })
})

app.post('/api/requests', auth, (req, res) => {
  const title = String(req.body.title || '').trim()
  const description = String(req.body.description || '').trim()
  if (!title) return res.status(400).json({ error: 'Опишите, что случилось' })
  if (title.length > 200) return res.status(400).json({ error: 'Сократите заголовок до 200 символов' })
  if (description.length > 10_000) return res.status(400).json({ error: 'Сократите описание до 10 000 символов' })

  const request = createRequest({ userId: req.userId, title, description })
  const fullRequest = getRequestById(request.id, req.userId) || request
  addMessage({ requestId: fullRequest.id, sender: 'user', text: description || title })
  answerWithAssistant(fullRequest.id, description || title, null)
  res.status(201).json({ request: fullRequest })
})

app.post('/api/manager/messages', auth, (req, res) => {
  const text = String(req.body.text || '').trim()
  if (!text) return res.status(400).json({ error: 'Сообщение пустое' })
  if (text.length > 10_000) return res.status(400).json({ error: 'Сократите сообщение до 10 000 символов' })

  const title = text.length > 80 ? `${text.slice(0, 77)}…` : text
  const request = createRequest({ userId: req.userId, title, description: text })
  updateRequest(request.id, { status: 'waiting', level: 'l1' })
  addMessage({ requestId: request.id, sender: 'user', text })
  addMessage({
    requestId: request.id,
    sender: 'system',
    text: 'Сообщение передано команде сопровождения. Повторно описывать вопрос не нужно.',
  })

  res.status(201).json({ request: getRequestById(request.id, req.userId) })
})

app.get('/api/requests/:id', auth, (req, res) => {
  const request = getRequestById(Number(req.params.id), req.userId)
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })
  res.json({ request, messages: getMessagesByRequestId(request.id) })
})

app.post('/api/requests/:id/messages', auth, async (req, res) => {
  const request = getRequestById(Number(req.params.id), req.userId)
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })
  if (request.status === 'done') return res.status(409).json({ error: 'Вопрос уже решён' })

  const text = String(req.body.text || '').trim()
  if (!text) return res.status(400).json({ error: 'Сообщение пустое' })
  if (text.length > 10_000) return res.status(400).json({ error: 'Сократите сообщение до 10 000 символов' })
  addMessage({ requestId: request.id, sender: 'user', text })

  if (request.level === 'l0') {
    const result = await askAssistant(text, request.assistant_thread_id)
    addMessage({ requestId: request.id, sender: 'assistant', text: result.text })
    updateRequest(request.id, {
      ...(result.threadId ? { assistant_thread_id: result.threadId } : {}),
      ...(!result.available ? { status: 'waiting', level: 'l1' } : {}),
    })
    return res.json({ message: { sender: 'assistant', text: result.text } })
  }

  res.json({ message: null })
})

app.post('/api/requests/:id/evaluate', auth, (req, res) => {
  const request = getRequestById(Number(req.params.id), req.userId)
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })

  if (req.body.helped === true) {
    updateRequest(request.id, { status: 'done' })
    addMessage({ requestId: request.id, sender: 'system', text: 'Вопрос решён' })
  } else if (req.body.helped === false) {
    updateRequest(request.id, { status: 'waiting', level: 'l1' })
    addMessage({ requestId: request.id, sender: 'system', text: 'Подключаем специалиста. Повторно описывать не нужно.' })
  } else {
    return res.status(400).json({ error: 'Передайте helped: true или false' })
  }

  res.json({ request: getRequestById(request.id, req.userId) })
})

app.get('/api/admin/stats', auth, adminOnly, (_req, res) => {
  res.json({
    ...getStats(),
    server: {
      status: 'ok',
      assistant: isAssistantConfigured() ? 'configured' : 'not_configured',
      database: 'ok',
      uptime: Math.round(process.uptime()),
      startedAt: startedAt.toISOString(),
      time: new Date().toISOString(),
    },
  })
})

app.get('/api/admin/users', auth, adminOnly, (_req, res) => {
  res.json({ users: getAllUsers() })
})

app.get('/api/admin/requests', auth, adminOnly, (_req, res) => {
  res.json({ requests: getAllRequests() })
})

app.get('/api/admin/organizations', auth, adminOnly, (_req, res) => {
  res.json({ organizations: getOrganizations() })
})

app.get('/api/admin/requests/:id/messages', auth, adminOnly, (req, res) => {
  const request = getAllRequests().find(item => item.id === Number(req.params.id))
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })
  res.json({ request, messages: getMessagesByRequestId(request.id) })
})

app.patch('/api/admin/requests/:id', auth, adminOnly, (req, res) => {
  const request = getAllRequests().find(item => item.id === Number(req.params.id))
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })

  const updates = {}
  if (['open', 'waiting', 'done'].includes(req.body.status)) updates.status = req.body.status
  if (['l0', 'l1'].includes(req.body.level)) updates.level = req.body.level
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Нет допустимых изменений' })
  res.json({ request: updateRequest(request.id, updates) })
})

app.post('/api/admin/requests/:id/messages', auth, adminOnly, (req, res) => {
  const request = getAllRequests().find(item => item.id === Number(req.params.id))
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })
  const text = String(req.body.text || '').trim()
  if (!text) return res.status(400).json({ error: 'Сообщение пустое' })
  if (text.length > 10_000) return res.status(400).json({ error: 'Сократите сообщение до 10 000 символов' })
  res.status(201).json({ message: addMessage({ requestId: request.id, sender: 'admin', text }) })
})

app.post('/api/admin/test-assistant', auth, adminOnly, async (req, res) => {
  const message = String(req.body.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Введите сообщение' })
  if (message.length > 2_000) return res.status(400).json({ error: 'Сократите сообщение до 2 000 символов' })
  res.json(await askAssistant(message, null))
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

const staticDir = resolve(process.env.STATIC_DIR || join(__dirname, '..', 'dist'))
if (fs.existsSync(join(staticDir, 'index.html'))) {
  app.use(express.static(staticDir))
  app.get('*', (_req, res) => res.sendFile(join(staticDir, 'index.html')))
} else {
  app.get('/', (_req, res) => {
    res.status(503).send('Frontend is not built. Run npm run build before starting the server.')
  })
}

app.use((error, _req, res, _next) => {
  console.error('Unhandled server error:', error.message)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

async function answerWithAssistant(requestId, message, threadId) {
  try {
    const result = await askAssistant(message, threadId)
    addMessage({ requestId, sender: 'assistant', text: result.text })
    updateRequest(requestId, {
      ...(result.threadId ? { assistant_thread_id: result.threadId } : {}),
      ...(!result.available ? { status: 'waiting', level: 'l1' } : {}),
    })
  } catch (error) {
    console.error(`Assistant background task failed: ${error.message}`)
    updateRequest(requestId, { status: 'waiting', level: 'l1' })
  }
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`prosto. server running on http://localhost:${PORT}`)
  })
}

export { app }
