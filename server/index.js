import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import {
  createUser, findUserByEmail, findUserById,
  createRequest, getRequestsByUserId, getRequestById, updateRequest,
  addMessage, getMessagesByRequestId,
  getAllUsers, getAllRequests, getOrganizations, getStats,
} from './db.js'
import { askAssistant } from './assistant.js'

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'prosto-secret-key-2026'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// === HEALTH ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), uptime: process.uptime() })
})

// === AUTH MIDDLEWARE ===
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Нет токена' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userRole = decoded.role || 'user'
    next()
  } catch {
    res.status(401).json({ error: 'Неверный токен' })
  }
}

function adminOnly(req, res, next) {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Доступ только для администратора' })
  next()
}

// === AUTH ===
app.post('/api/auth/register', (req, res) => {
  const { email, password, inn, name } = req.body
  if (!email || !password || !inn) return res.status(400).json({ error: 'Email, пароль и ИНН обязательны' })
  const existing = findUserByEmail(email)
  if (existing) return res.status(409).json({ error: 'Пользователь с таким email уже существует' })
  createUser({ email, password, inn, name })
  const user = findUserByEmail(email)
  if (!user) return res.status(500).json({ error: 'Ошибка создания пользователя' })
  const token = jwt.sign({ userId: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user: { id: user.id, email: user.email, inn: user.inn, name: user.name, role: 'user' } })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' })
  const user = findUserByEmail(email)
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Неверный email или пароль' })
  const token = jwt.sign({ userId: user.id, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user: { id: user.id, email: user.email, inn: user.inn, name: user.name, role: user.role || 'user' } })
})

app.get('/api/auth/me', auth, (req, res) => {
  const user = findUserById(req.userId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  res.json({ user })
})

// === USER REQUESTS ===
app.get('/api/requests', auth, (req, res) => {
  res.json({ requests: getRequestsByUserId(req.userId) })
})

app.post('/api/requests', auth, (req, res) => {
  const { title, description } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Опишите, что случилось' })
  const request = createRequest({ userId: req.userId, title: title.trim(), description: description || '' })
  const fullRequest = getRequestById(request.id, req.userId) || request
  addMessage({ requestId: fullRequest.id, sender: 'user', text: description || title })
  askAssistant(description || title).then(result => {
    addMessage({ requestId: fullRequest.id, sender: 'assistant', text: result.text })
    if (!result.available) updateRequest(fullRequest.id, { status: 'waiting', level: 'l1' })
  }).catch(err => console.error('Assistant error:', err))
  res.json({ request: fullRequest })
})

app.get('/api/requests/:id', auth, (req, res) => {
  const request = getRequestById(Number(req.params.id), req.userId)
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })
  res.json({ request, messages: getMessagesByRequestId(request.id) })
})

app.post('/api/requests/:id/messages', auth, async (req, res) => {
  const request = getRequestById(Number(req.params.id), req.userId)
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Сообщение пустое' })
  addMessage({ requestId: request.id, sender: 'user', text: text.trim() })
  if (request.level === 'l0' && request.status !== 'done') {
    const result = await askAssistant(text.trim())
    addMessage({ requestId: request.id, sender: 'assistant', text: result.text })
    if (!result.available) updateRequest(request.id, { status: 'waiting', level: 'l1' })
    return res.json({ message: { sender: 'assistant', text: result.text } })
  }
  res.json({ message: null })
})

app.post('/api/requests/:id/evaluate', auth, (req, res) => {
  const request = getRequestById(Number(req.params.id), req.userId)
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })
  const { helped } = req.body
  if (helped) {
    updateRequest(request.id, { status: 'done' })
    addMessage({ requestId: request.id, sender: 'system', text: 'Вопрос решён' })
  } else {
    updateRequest(request.id, { status: 'waiting', level: 'l1' })
    addMessage({ requestId: request.id, sender: 'system', text: 'Подключаем специалиста. Повторно описывать не нужно.' })
  }
  res.json({ request: updateRequest(request.id, {}) })
})

// === ADMIN ENDPOINTS ===
app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  res.json(getStats())
})

app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  res.json({ users: getAllUsers() })
})

app.get('/api/admin/requests', auth, adminOnly, (req, res) => {
  res.json({ requests: getAllRequests() })
})

app.get('/api/admin/organizations', auth, adminOnly, (req, res) => {
  res.json({ organizations: getOrganizations() })
})

app.get('/api/admin/requests/:id/messages', auth, adminOnly, (req, res) => {
  res.json({ messages: getMessagesByRequestId(Number(req.params.id)) })
})

app.post('/api/admin/test-assistant', auth, adminOnly, async (req, res) => {
  const { message } = req.body
  if (!message) return res.status(400).json({ error: 'Введите сообщение' })
  const result = await askAssistant(message)
  res.json(result)
})

app.listen(PORT, () => {
  console.log(`просто. server running on http://localhost:${PORT}`)
})
