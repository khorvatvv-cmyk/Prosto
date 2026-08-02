import initSqlJs from 'sql.js'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || join(__dirname, 'data', 'prosto.db')
const dataDir = dirname(dbPath)
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const SQL = await initSqlJs()
let db
if (fs.existsSync(dbPath)) {
  db = new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)))
} else {
  db = new SQL.Database()
}

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    inn TEXT,
    name TEXT,
    organization TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    level TEXT DEFAULT 'l0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// Migration: add role column if missing
try { db.run('ALTER TABLE users ADD COLUMN role TEXT DEFAULT \'user\'') } catch(e) {}

function save() {
  fs.writeFileSync(dbPath, Buffer.from(db.export()))
}

// === ADMIN BOOTSTRAP ===
const adminEmail = process.env.ADMIN_EMAIL || 'admin@prosto.ru'
const adminPass = process.env.ADMIN_PASSWORD || 'admin123456'
const existingAdmin = queryOne('SELECT id FROM users WHERE email = ?', [adminEmail])
if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPass, 10)
  db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [adminEmail, hash, 'Администратор', 'admin'])
  save()
  console.log(`Admin created: ${adminEmail} / ${adminPass}`)
} else {
  // Ensure admin has role
  if (existingAdmin.role !== 'admin') {
    db.run('UPDATE users SET role = \'admin\' WHERE email = ?', [adminEmail])
    save()
  }
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  let row = null
  if (stmt.step()) row = stmt.getAsObject()
  stmt.free()
  return row
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function executeAndGetId(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  stmt.step()
  stmt.free()
  save()
  const row = queryOne('SELECT last_insert_rowid() as id')
  let id = row?.id
  if (!id || id === 0) {
    const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i)
    if (tableMatch) {
      const maxRow = queryOne(`SELECT MAX(id) as id FROM ${tableMatch[1]}`)
      id = maxRow?.id || 1
    }
  }
  return id || 1
}

// === USER FUNCTIONS ===
export function createUser({ email, password, inn, name }) {
  const hash = bcrypt.hashSync(password, 10)
  const id = executeAndGetId('INSERT INTO users (email, password, inn, name) VALUES (?, ?, ?, ?)', [email, hash, inn, name])
  return { id, email, inn, name }
}

export function findUserByEmail(email) {
  return queryOne('SELECT * FROM users WHERE email = ?', [email])
}

export function findUserById(id) {
  return queryOne('SELECT id, email, inn, name, organization, role, created_at FROM users WHERE id = ?', [id])
}

// === REQUEST FUNCTIONS ===
export function createRequest({ userId, title, description }) {
  const id = executeAndGetId('INSERT INTO requests (user_id, title, description) VALUES (?, ?, ?)', [userId, title, description])
  return { id, userId, title, description, status: 'open', level: 'l0' }
}

export function getRequestsByUserId(userId) {
  return queryAll('SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC', [userId])
}

export function getRequestById(id, userId) {
  return queryOne('SELECT * FROM requests WHERE id = ? AND user_id = ?', [id, userId])
}

export function updateRequest(id, updates) {
  for (const [k, v] of Object.entries(updates)) {
    if (['status', 'level', 'title', 'description'].includes(k)) {
      db.run(`UPDATE requests SET ${k} = ? WHERE id = ?`, [v, id])
    }
  }
  save()
  return queryOne('SELECT * FROM requests WHERE id = ?', [id])
}

export function addMessage({ requestId, sender, text }) {
  const id = executeAndGetId('INSERT INTO messages (request_id, sender, text) VALUES (?, ?, ?)', [requestId, sender, text])
  return { id, requestId, sender, text }
}

export function getMessagesByRequestId(requestId) {
  return queryAll('SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC', [requestId])
}

// === ADMIN FUNCTIONS ===
export function getAllUsers() {
  return queryAll('SELECT id, email, inn, name, organization, role, created_at FROM users ORDER BY created_at DESC')
}

export function getAllRequests() {
  return queryAll(`
    SELECT r.*, u.email, u.name as user_name, u.inn,
      (SELECT COUNT(*) FROM messages WHERE request_id = r.id) as msg_count
    FROM requests r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `)
}

export function getOrganizations() {
  const users = queryAll('SELECT id, email, inn, name, organization, created_at FROM users WHERE role = \'user\' ORDER BY inn')
  const orgs = {}
  for (const u of users) {
    const inn = u.inn || 'без ИНН'
    if (!orgs[inn]) {
      orgs[inn] = { inn, users: [], requestCount: 0 }
    }
    orgs[inn].users.push(u)
    const reqs = queryAll('SELECT id, title, status, created_at FROM requests WHERE user_id = ? ORDER BY created_at DESC', [u.id])
    orgs[inn].requestCount += reqs.length
    if (reqs.length > 0) orgs[inn].lastRequest = reqs[0].created_at
    orgs[inn].requests = orgs[inn].requests || []
    orgs[inn].requests.push(...reqs)
  }
  return Object.values(orgs)
}

export function getStats() {
  const users = queryOne('SELECT COUNT(*) as count FROM users')
  const requests = queryOne('SELECT COUNT(*) as count FROM requests')
  const messages = queryOne('SELECT COUNT(*) as count FROM messages')
  const openReqs = queryOne('SELECT COUNT(*) as count FROM requests WHERE status = \'open\' OR status = \'waiting\'')
  const doneReqs = queryOne('SELECT COUNT(*) as count FROM requests WHERE status = \'done\'')
  const orgs = queryOne('SELECT COUNT(DISTINCT inn) as count FROM users WHERE inn IS NOT NULL AND inn != \'\'')
  return {
    users: users?.count || 0,
    requests: requests?.count || 0,
    messages: messages?.count || 0,
    openRequests: openReqs?.count || 0,
    doneRequests: doneReqs?.count || 0,
    organizations: orgs?.count || 0,
  }
}
