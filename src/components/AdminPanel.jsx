import { useState, useEffect } from 'react'
import { adminApi } from '../api.js'

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [testMsg, setTestMsg] = useState('')
  const [testResult, setTestResult] = useState('')
  const [testing, setTesting] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [messages, setMessages] = useState([])
  const [newSpecEmail, setNewSpecEmail] = useState('')
  const [newSpecPassword, setNewSpecPassword] = useState('')
  const [newSpecName, setNewSpecName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newManagerEmail, setNewManagerEmail] = useState('')
  const [newManagerPassword, setNewManagerPassword] = useState('')
  const [newManagerName, setNewManagerName] = useState('')
  const [creatingManager, setCreatingManager] = useState(false)
  const [createManagerError, setCreateManagerError] = useState('')
  const [newRofEmail, setNewRofEmail] = useState('')
  const [newRofPassword, setNewRofPassword] = useState('')
  const [newRofName, setNewRofName] = useState('')
  const [creatingRof, setCreatingRof] = useState(false)
  const [createRofError, setCreateRofError] = useState('')
  const [roleNotice, setRoleNotice] = useState('')
  const [promoteRofUserId, setPromoteRofUserId] = useState('')
  const [promotingRof, setPromotingRof] = useState(false)

  const A = '#E50071', INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'

  async function load() {
    setLoading(true)
    try {
      const [s, u, r, o] = await Promise.all([
        adminApi.stats(),
        adminApi.users(),
        adminApi.requests(),
        adminApi.organizations(),
      ])
      setStats(s)
      setUsers(u.users || [])
      setRequests(r.requests || [])
      setOrgs(o.organizations || [])
    } catch (e) {
      console.error('Admin load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function viewRequest(id) {
    setSelectedRequest(id)
    try {
      const data = await adminApi.requestMessages(id)
      setMessages(data.messages || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function testAssistant() {
    if (!testMsg.trim()) return
    setTesting(true)
    setTestResult('')
    try {
      const data = await adminApi.testAssistant(testMsg.trim())
      setTestResult(data.text || 'Нет ответа')
    } catch (e) {
      setTestResult('Ошибка: ' + e.message)
    } finally {
      setTesting(false)
    }
  }

  async function changeRole(userId, role) {
    setRoleNotice('')
    try {
      await adminApi.setUserRole(userId, role)
      await load()
      setRoleNotice('Роль пользователя обновлена')
    } catch (e) {
      setRoleNotice('Ошибка: ' + (e.message || 'не удалось изменить роль'))
    }
  }

  async function createSpecialist() {
    if (!newSpecEmail.trim() || !newSpecPassword.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      await adminApi.createSpecialist(newSpecEmail.trim(), newSpecPassword, newSpecName.trim())
      setNewSpecEmail('')
      setNewSpecPassword('')
      setNewSpecName('')
      await load()
    } catch (e) {
      setCreateError(e.message || 'Не удалось создать')
    } finally {
      setCreating(false)
    }
  }

  async function createManager() {
    if (!newManagerEmail.trim() || !newManagerPassword.trim()) return
    setCreatingManager(true)
    setCreateManagerError('')
    try {
      await adminApi.createManager(newManagerEmail.trim(), newManagerPassword, newManagerName.trim())
      setNewManagerEmail('')
      setNewManagerPassword('')
      setNewManagerName('')
      await load()
    } catch (e) {
      setCreateManagerError(e.message || 'Не удалось создать менеджера')
    } finally {
      setCreatingManager(false)
    }
  }

  async function createRof() {
    if (!newRofEmail.trim() || !newRofPassword.trim()) return
    setCreatingRof(true)
    setCreateRofError('')
    try {
      await adminApi.createRof(newRofEmail.trim(), newRofPassword, newRofName.trim())
      setNewRofEmail('')
      setNewRofPassword('')
      setNewRofName('')
      await load()
    } catch (e) {
      setCreateRofError(e.message || 'Не удалось создать РОФ')
    } finally {
      setCreatingRof(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка админ-панели…</div>
  }

  const tabs = [
    { id: 'dashboard', label: 'Обзор' },
    { id: 'users', label: 'Пользователи' },
    { id: 'specialists', label: 'Специалисты' },
    { id: 'managers', label: 'Менеджеры' },
    { id: 'rofs', label: 'РОФ' },
    { id: 'orgs', label: 'Организации' },
    { id: 'requests', label: 'Вопросы' },
    { id: 'test', label: 'Тест ассистента' },
  ]

  const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
  const server = stats?.server || {}
  const formatUptime = (seconds = 0) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours} ч ${minutes % 60} мин` : `${minutes} мин`
  }

  async function promoteToRof() {
    if (!promoteRofUserId) return
    setPromotingRof(true)
    setRoleNotice('')
    try {
      await adminApi.setUserRole(Number(promoteRofUserId), 'rof')
      setPromoteRofUserId('')
      await load()
      setRoleNotice('Пользователю назначена роль РОФ')
    } catch (e) {
      setRoleNotice('Ошибка: ' + (e.message || 'не удалось назначить РОФ'))
    } finally {
      setPromotingRof(false)
    }
  }

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: A, marginBottom: 6 }}>АДМИН-ПАНЕЛЬ</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: INK }}>Управление</h1>
        </div>
        <button onClick={load} style={{ background: S, color: INK, border: `1px solid ${BD}`, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
          Обновить
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 20, padding: 4, background: S2, borderRadius: 10, width: 'fit-content', maxWidth: '100%' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedRequest(null) }}
            style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: tab === t.id ? INK : M, background: tab === t.id ? S : 'transparent', boxShadow: tab === t.id ? '0 1px 2px rgba(0,0,0,.03)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* === DASHBOARD === */}
      {tab === 'dashboard' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Пользователи', value: stats.users, color: INK },
              { label: 'Организации', value: stats.organizations, color: INK },
              { label: 'Вопросы', value: stats.requests, color: INK },
              { label: 'Открытые', value: stats.openRequests, color: A },
              { label: 'Решённые', value: stats.doneRequests, color: '#22c55e' },
              { label: 'Сообщения', value: stats.messages, color: INK },
            ].map((m, i) => (
              <div key={i} style={{ background: S, border: `1px solid ${BD}`, padding: 18, borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* SERVER STATUS */}
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: INK }}>Статус сервера</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: M }}>Backend</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: server.status === 'ok' ? '#22c55e' : A }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: server.status === 'ok' ? '#22c55e' : A }}></span>
                  {server.status === 'ok' ? 'Онлайн' : 'Нет данных'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: M }}>База данных</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: server.database === 'ok' ? '#22c55e' : A }}>
                  {server.database === 'ok' ? 'Доступна' : 'Нет данных'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: M }}>Ассистент ПРОСТО</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: server.assistant === 'configured' ? '#22c55e' : A }}>
                    {server.assistant === 'configured' ? 'Подключён' : 'Не настроен'}
                  </span>
                  <button onClick={() => setTab('test')} style={{ fontSize: 13, fontWeight: 600, color: A, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Проверить →
                  </button>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: M }}>Время работы после запуска</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{formatUptime(server.uptime)}</span>
              </div>
            </div>
          </div>

          {/* RECENT REQUESTS */}
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: INK }}>Последние вопросы</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requests.slice(0, 5).map(r => (
                <div key={r.id} onClick={() => { setTab('requests'); viewRequest(r.id) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${S2}`, cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: INK, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                  <span style={{ fontSize: 12, color: M }}>{r.email}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: r.status === 'done' ? '#22c55e' : A }}>{r.status}</span>
                </div>
              ))}
              {requests.length === 0 && <div style={{ fontSize: 14, color: M, padding: 12 }}>Вопросов пока нет</div>}
            </div>
          </div>
        </div>
      )}

      {/* === USERS === */}
      {tab === 'users' && (
        <div>
          <div style={{ background: '#FFF0F7', border: `1px solid ${A}22`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>Как назначить РОФ</div>
            <div style={{ fontSize: 13, color: M }}>У существующего пользователя выберите роль «РОФ» в столбце «Действие» или создайте отдельную учётную запись на вкладке «РОФ».</div>
            <button onClick={() => setTab('rofs')} style={{ marginTop: 10, height: 32, padding: '0 12px', border: 'none', borderRadius: 6, background: A, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Открыть вкладку РОФ</button>
          </div>
          {roleNotice && <div style={{ fontSize: 13, color: roleNotice.startsWith('Ошибка') ? A : '#16A34A', marginBottom: 10 }}>{roleNotice}</div>}
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BD}` }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Имя</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>ИНН</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Роль</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Создан</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Действие</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${S2}` }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{u.id}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500 }}>{u.email}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13 }}>{u.name || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{u.inn || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, background: u.role === 'admin' ? '#FFF0F7' : u.role === 'specialist' ? '#F0FDF4' : S2, color: u.role === 'admin' ? A : u.role === 'specialist' ? '#16A34A' : M }}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{formatDate(u.created_at)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13 }}>
                    {u.role !== 'admin' ? (
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${BD}`, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
                      >
                        <option value="user">Клиент</option>
                        <option value="specialist">Специалист L1</option>
                        <option value="manager">Менеджер</option>
                        <option value="rof">РОФ</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, color: L }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>Нет пользователей</div>}
          </div>
        </div>
      )}

      {/* === SPECIALISTS === */}
      {tab === 'specialists' && (
        <div>
          {/* Create form */}
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 20, maxWidth: 500 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Добавить специалиста L1</h3>
            <p style={{ fontSize: 13, color: M, marginBottom: 16 }}>Специалист сможет входить в приложение и видеть обращения на линии L1.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" value={newSpecName} onChange={e => setNewSpecName(e.target.value)} placeholder="Имя специалиста"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              <input type="email" value={newSpecEmail} onChange={e => setNewSpecEmail(e.target.value)} placeholder="Email"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              <input type="password" value={newSpecPassword} onChange={e => setNewSpecPassword(e.target.value)} placeholder="Пароль (мин. 8 символов)"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              {createError && <div style={{ fontSize: 13, color: A, padding: '8px 12px', background: '#FFF0F7', borderRadius: 8 }}>{createError}</div>}
              <button onClick={createSpecialist} disabled={creating || !newSpecEmail.trim() || !newSpecPassword.trim()}
                style={{ height: 46, background: creating || !newSpecEmail.trim() || !newSpecPassword.trim() ? S2 : A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {creating ? 'Создание…' : 'Создать специалиста'}
              </button>
            </div>
          </div>

          {/* Existing specialists */}
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BD}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Имя</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Создан</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Действие</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === 'specialist').map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${S2}` }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500 }}>{u.email}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{u.name || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{formatDate(u.created_at)}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>
                      <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${BD}`, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                        <option value="specialist">Специалист L1</option>
                        <option value="user">Снять роль</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.filter(u => u.role === 'specialist').length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>Специалистов пока нет</div>}
          </div>
        </div>
      )}

      {/* === MANAGERS === */}
      {tab === 'managers' && (
        <div>
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 20, maxWidth: 500 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Добавить менеджера</h3>
            <p style={{ fontSize: 13, color: M, marginBottom: 16 }}>Менеджер видит своих клиентов, обращения и чаты.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" value={newManagerName} onChange={e => setNewManagerName(e.target.value)} placeholder="Имя менеджера"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              <input type="email" value={newManagerEmail} onChange={e => setNewManagerEmail(e.target.value)} placeholder="Email"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              <input type="password" value={newManagerPassword} onChange={e => setNewManagerPassword(e.target.value)} placeholder="Пароль (мин. 8 символов)"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              {createManagerError && <div style={{ fontSize: 13, color: A, padding: '8px 12px', background: '#FFF0F7', borderRadius: 8 }}>{createManagerError}</div>}
              <button onClick={createManager} disabled={creatingManager || !newManagerEmail.trim() || !newManagerPassword.trim()}
                style={{ height: 46, background: creatingManager || !newManagerEmail.trim() || !newManagerPassword.trim() ? S2 : A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: creatingManager ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {creatingManager ? 'Создание…' : 'Создать менеджера'}
              </button>
            </div>
          </div>
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${BD}` }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Имя</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Создан</th>
              </tr></thead>
              <tbody>
                {users.filter(u => u.role === 'manager').map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${S2}` }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500 }}>{u.email}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{u.name || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.filter(u => u.role === 'manager').length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>Менеджеров пока нет</div>}
          </div>
        </div>
      )}

      {/* === ROF === */}
      {tab === 'rofs' && (
        <div>
          <div style={{ background: '#FFF0F7', border: `1px solid ${A}22`, borderRadius: 10, padding: 20, marginBottom: 20, maxWidth: 620 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Назначить существующего пользователя РОФ</h3>
            <p style={{ fontSize: 13, color: M, marginBottom: 14 }}>Выберите уже зарегистрированного пользователя. После следующего входа ему откроется только АРМ РОФ.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={promoteRofUserId} onChange={e => setPromoteRofUserId(e.target.value)}
                style={{ minWidth: 280, flex: 1, height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 10px', background: S, fontSize: 13, fontFamily: 'inherit' }}>
                <option value="">Выберите пользователя</option>
                {users.filter(u => !['admin', 'rof'].includes(u.role)).map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email} — {u.email} ({u.role === 'user' ? 'клиент' : u.role})</option>
                ))}
              </select>
              <button onClick={promoteToRof} disabled={promotingRof || !promoteRofUserId}
                style={{ height: 40, padding: '0 16px', background: promoteRofUserId ? INK : S2, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: promoteRofUserId ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                {promotingRof ? 'Назначение…' : 'Сделать РОФ'}
              </button>
            </div>
            {roleNotice && <div style={{ marginTop: 10, fontSize: 13, color: roleNotice.startsWith('Ошибка') ? A : '#16A34A' }}>{roleNotice}</div>}
          </div>
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 20, maxWidth: 500 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Добавить РОФ</h3>
            <p style={{ fontSize: 13, color: M, marginBottom: 16 }}>Либо создайте новую отдельную учётную запись. РОФ увидит всех клиентов, менеджеров и состояние очереди L1.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" value={newRofName} onChange={e => setNewRofName(e.target.value)} placeholder="Имя РОФ"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              <input type="email" value={newRofEmail} onChange={e => setNewRofEmail(e.target.value)} placeholder="Email"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              <input type="password" value={newRofPassword} onChange={e => setNewRofPassword(e.target.value)} placeholder="Пароль (мин. 8 символов)"
                style={{ height: 42, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              {createRofError && <div style={{ fontSize: 13, color: A, padding: '8px 12px', background: '#FFF0F7', borderRadius: 8 }}>{createRofError}</div>}
              <button onClick={createRof} disabled={creatingRof || !newRofEmail.trim() || !newRofPassword.trim()}
                style={{ height: 46, background: creatingRof || !newRofEmail.trim() || !newRofPassword.trim() ? S2 : A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: creatingRof ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {creatingRof ? 'Создание…' : 'Создать РОФ'}
              </button>
            </div>
          </div>
          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${BD}` }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Имя</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Создан</th>
              </tr></thead>
              <tbody>
                {users.filter(u => u.role === 'rof').map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${S2}` }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500 }}>{u.email}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{u.name || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.filter(u => u.role === 'rof').length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>РОФов пока нет</div>}
          </div>
        </div>
      )}

      {/* === ORGANIZATIONS === */}
      {tab === 'orgs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { title: 'Обращались', items: orgs.filter(org => org.requestCount > 0), color: A },
            { title: 'Ещё не обращались', items: orgs.filter(org => org.requestCount === 0), color: M },
          ].map(group => (
            <section key={group.title}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: INK }}>{group.title}</h3>
                <span style={{ fontSize: 12, fontWeight: 700, color: group.color, background: S2, padding: '2px 8px', borderRadius: 999 }}>{group.items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {group.items.map(org => (
                  <div key={org.inn} style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>ИНН: {org.inn}</span>
                        <span style={{ fontSize: 13, color: M, marginLeft: 12 }}>{org.users.length} польз.</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: org.requestCount > 0 ? A : M }}>
                        {org.requestCount > 0 ? `${org.requestCount} вопросов` : 'Нет вопросов'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {org.users.map(u => (
                        <span key={u.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: S2, color: M }}>
                          {u.name || u.email}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {group.items.length === 0 && <div style={{ padding: 16, background: S, border: `1px dashed ${BD}`, borderRadius: 10, color: M, fontSize: 13 }}>В этой группе пока нет организаций</div>}
              </div>
            </section>
          ))}
          {orgs.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>Нет организаций</div>}
        </div>
      )}

      {/* === REQUESTS === */}
      {tab === 'requests' && (
        <div>
          {selectedRequest ? (
            <div>
              <button onClick={() => setSelectedRequest(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: M, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', marginBottom: 16 }}>
                ← Назад к списку
              </button>
              <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: m.sender === 'user' ? S2 : m.sender === 'system' ? S2 : S, border: `1px solid ${BD}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: m.sender === 'assistant' ? A : L, marginBottom: 6 }}>
                      {m.sender === 'assistant' ? 'Ассистент ПРОСТО' : m.sender === 'user' ? 'Пользователь' : 'Система'}
                    </div>
                    <div style={{ fontSize: 14, color: INK, lineHeight: 1.5 }}>{m.text}</div>
                  </div>
                ))}
                {messages.length === 0 && <div style={{ color: M }}>Нет сообщений</div>}
              </div>
            </div>
          ) : (
            <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BD}` }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Тема</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Пользователь</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>ИНН</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Статус</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Дата</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${S2}`, cursor: 'pointer' }} onClick={() => viewRequest(r.id)}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{r.id}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13 }}>{r.name || r.email}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{r.inn || '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, background: r.status === 'done' ? S2 : '#FFF0F7', color: r.status === 'done' ? '#22c55e' : A }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{formatDate(r.created_at)}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: A }}>→</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>Вопросов нет</div>}
            </div>
          )}
        </div>
      )}

      {/* === TEST ASSISTANT === */}
      {tab === 'test' && (
        <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 24, maxWidth: 600 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: INK }}>Тест ассистента ПРОСТО</h3>
          <p style={{ fontSize: 14, color: M, marginBottom: 20 }}>Отправьте сообщение ассистенту и проверьте ответ.</p>

          <input type="text" value={testMsg} onChange={e => setTestMsg(e.target.value)} placeholder="Введите сообщение для ассистента…"
            style={{ width: '100%', height: 46, border: `1px solid ${BD}`, background: S, fontSize: 15, fontFamily: 'inherit', outline: 'none', color: INK, padding: '0 14px', borderRadius: 8, marginBottom: 16, boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = A}
            onBlur={e => e.target.style.borderColor = BD}
            onKeyDown={e => { if (e.key === 'Enter') testAssistant() }} />

          <button onClick={testAssistant} disabled={testing || !testMsg.trim()}
            style={{ background: testing ? S2 : A, color: '#fff', border: 'none', padding: '0 24px', height: 44, fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: testing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {testing ? 'Проверка…' : 'Отправить'}
          </button>

          {testResult && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: S2, border: `1px solid ${BD}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: A, marginBottom: 8 }}>Ответ ассистента</div>
              <div style={{ fontSize: 14, color: INK, lineHeight: 1.6 }}>{testResult}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
