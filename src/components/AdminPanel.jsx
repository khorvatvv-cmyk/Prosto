import { useState, useEffect } from 'react'
import { requestsApi } from '../api.js'

export default function AdminPanel({ user }) {
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

  const A = '#E50071', INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'

  async function load() {
    setLoading(true)
    try {
      const token = localStorage.getItem('prosto_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [s, u, r, o] = await Promise.all([
        fetch('https://prosto-0eq7.onrender.com/api/admin/stats', { headers }).then(r => r.json()),
        fetch('https://prosto-0eq7.onrender.com/api/admin/users', { headers }).then(r => r.json()),
        fetch('https://prosto-0eq7.onrender.com/api/admin/requests', { headers }).then(r => r.json()),
        fetch('https://prosto-0eq7.onrender.com/api/admin/organizations', { headers }).then(r => r.json()),
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
      const token = localStorage.getItem('prosto_token')
      const r = await fetch(`https://prosto-0eq7.onrender.com/api/admin/requests/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await r.json()
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
      const token = localStorage.getItem('prosto_token')
      const r = await fetch('https://prosto-0eq7.onrender.com/api/admin/test-assistant', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMsg.trim() })
      })
      const data = await r.json()
      setTestResult(data.text || 'Нет ответа')
    } catch (e) {
      setTestResult('Ошибка: ' + e.message)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка админ-панели…</div>
  }

  const tabs = [
    { id: 'dashboard', label: 'Обзор' },
    { id: 'users', label: 'Пользователи' },
    { id: 'orgs', label: 'Организации' },
    { id: 'requests', label: 'Вопросы' },
    { id: 'test', label: 'Тест ассистента' },
  ]

  const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

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
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, padding: 4, background: S2, borderRadius: 10, width: 'fit-content' }}>
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></span> Онлайн
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: M }}>Ассистент ПРОСТО</span>
                <button onClick={() => setTab('test')} style={{ fontSize: 13, fontWeight: 600, color: A, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Проверить →
                </button>
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
        <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BD}` }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Имя</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>ИНН</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Роль</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Создан</th>
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
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, background: u.role === 'admin' ? '#FFF0F7' : S2, color: u.role === 'admin' ? A : M }}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>Нет пользователей</div>}
        </div>
      )}

      {/* === ORGANIZATIONS === */}
      {tab === 'orgs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orgs.map((org, i) => (
            <div key={i} style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>ИНН: {org.inn}</span>
                  <span style={{ fontSize: 13, color: M, marginLeft: 12 }}>{org.users.length} польз.</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: org.requestCount > 0 ? A : M }}>
                    {org.requestCount > 0 ? `${org.requestCount} вопросов` : 'Не обращались'}
                  </span>
                  {org.requestCount > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: A }}></span>}
                  {org.requestCount === 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: L }}></span>}
                </div>
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
