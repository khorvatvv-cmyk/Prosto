import initSqlJs from 'sql.js'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || join(__dirname, 'data', 'prosto.db')
const dataDir = join(dbPath, '..')
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

function save() {
  fs.writeFileSync(dbPath, Buffer.from(db.export()))
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

function execute(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  stmt.step()
  stmt.free()
  save()
  // sql.js не всегда корректно возвращает last_insert_rowid,
  // поэтому ищем максимальный ID в таблице
  const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i)
  if (tableMatch) {
    const table = tableMatch[1]
    const row = queryOne(`SELECT MAX(id) as id FROM ${table}`)
    return row?.id || 1
  }
  const result = queryOne('SELECT last_insert_rowid() as id')
  return result?.id || 1
}

export function createUser({ email, password, inn, name }) {
  const hash = bcrypt.hashSync(password, 10)
  const id = execute('INSERT INTO users (email, password, inn, name) VALUES (?, ?, ?, ?)', [email, hash, inn, name])
  return { id, email, inn, name }
}

export function findUserByEmail(email) {
  return queryOne('SELECT * FROM users WHERE email = ?', [email])
}

export function findUserById(id) {
  return queryOne('SELECT id, email, inn, name, organization, created_at FROM users WHERE id = ?', [id])
}

export function createRequest({ userId, title, description }) {
  const id = execute('INSERT INTO requests (user_id, title, description) VALUES (?, ?, ?)', [userId, title, description])
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
      execute(`UPDATE requests SET ${k} = ? WHERE id = ?`, [v, id])
    }
  }
  return queryOne('SELECT * FROM requests WHERE id = ?', [id])
}

export function addMessage({ requestId, sender, text }) {
  const id = execute('INSERT INTO messages (request_id, sender, text) VALUES (?, ?, ?)', [requestId, sender, text])
  return { id, requestId, sender, text }
}

export function getMessagesByRequestId(requestId) {
  return queryAll('SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC', [requestId])
}
