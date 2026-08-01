import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import {
  createUser, findUserByEmail, findUserById,
  createRequest, getRequestsByUserId, getRequestById, updateRequest,
  addMessage, getMessagesByRequestId,
} from './db.js'
import { askAssistant } from './assistant.js'

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'prosto-secret-key-2026'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Нет токена' })
  try {
    req.userId = jwt.verify(token, JWT_SECRET).userId
    next()
  } catch {
    res.status(401).json({ error: 'Неверный токен' })
  }
}

// === AUTH ===
app.post('/api/auth/register', (req, res) => {
  const { email, password, inn, name } = req.body
  if (!email || !password || !inn) {
    return res.status(400).json({ error: 'Email, пароль и ИНН обязательны' })
  }
  const existing = findUserByEmail(email)
  if (existing) {
    return res.status(409).json({ error: 'Пользователь с таким email уже существует' })
  }
  createUser({ email, password, inn, name })
  // Загружаем созданного пользователя из БД для получения правильного ID
  const user = findUserByEmail(email)
  if (!user) {
    return res.status(500).json({ error: 'Ошибка создания пользователя' })
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user: { id: user.id, email: user.email, inn: user.inn, name: user.name } })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' })
  }
  const user = findUserByEmail(email)
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Неверный email или пароль' })
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user: { id: user.id, email: user.email, inn: user.inn, name: user.name } })
})

app.get('/api/auth/me', auth, (req, res) => {
  const user = findUserById(req.userId)
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  res.json({ user })
})

// === REQUESTS ===
app.get('/api/requests', auth, (req, res) => {
  const requests = getRequestsByUserId(req.userId)
  res.json({ requests })
})

app.post('/api/requests', auth, (req, res) => {
  const { title, description } = req.body
  if (!title?.trim()) {
    return res.status(400).json({ error: 'Опишите, что случилось' })
  }
  const request = createRequest({ userId: req.userId, title: title.trim(), description: description || '' })

  // Загружаем созданный вопрос из БД для получения правильного ID
  const fullRequest = getRequestById(request.id, req.userId) || request

  // Сохраняем сообщение пользователя
  addMessage({ requestId: fullRequest.id, sender: 'user', text: description || title })

  // Вызываем ассистента L0 (ассистент ПРОСТО)
  askAssistant(description || title).then(result => {
    addMessage({
      requestId: fullRequest.id,
      sender: 'assistant',
      text: result.text,
    })
    if (!result.available) {
      updateRequest(fullRequest.id, { status: 'waiting', level: 'l1' })
    }
  }).catch(err => {
    console.error('Assistant error:', err)
  })

  res.json({ request: fullRequest })
})

app.get('/api/requests/:id', auth, (req, res) => {
  const request = getRequestById(Number(req.params.id), req.userId)
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })
  const messages = getMessagesByRequestId(request.id)
  res.json({ request, messages })
})

app.post('/api/requests/:id/messages', auth, async (req, res) => {
  const request = getRequestById(Number(req.params.id), req.userId)
  if (!request) return res.status(404).json({ error: 'Вопрос не найден' })

  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Сообщение пустое' })

  // Сохраняем сообщение пользователя
  addMessage({ requestId: request.id, sender: 'user', text: text.trim() })

  // Если уровень l0 — спрашиваем ассистента
  if (request.level === 'l0' && request.status !== 'done') {
    const result = await askAssistant(text.trim())
    addMessage({ requestId: request.id, sender: 'assistant', text: result.text })
    if (!result.available) {
      updateRequest(request.id, { status: 'waiting', level: 'l1' })
    }
    return res.json({ message: { sender: 'assistant', text: result.text } })
  }

  // Если l1 — просто сохраняем (специалист ответит отдельно)
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

app.listen(PORT, () => {
  console.log(`просто. server running on http://localhost:${PORT}`)
})
