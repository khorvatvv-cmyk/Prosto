import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, RefreshCw, Building2, ClipboardList, Check, X } from 'lucide-react'
import { managerApi } from '../api.js'

const A = '#E50071'
const INK = '#18181B'
const M = '#6B6B70'
const L = '#A0A0A5'
const S = '#FFFFFF'
const S2 = '#F4F4F5'
const BD = '#E4E4E7'

const SERVICE_STATUS = {
  unknown: { label: 'Не определён', color: M },
  its_prof: { label: '1С:ПРОФ', color: INK },
  fresh_prof: { label: '1С:ПРОФ (недавно)', color: '#16A34A' },
  other_regular: { label: 'Другая ИТС', color: INK },
  no_regular_contract: { label: 'Нет договора', color: A },
}

const REQUEST_STATUS = {
  'open': 'Открыто',
  'waiting': 'Ожидает специалиста',
  'in_progress': 'В работе',
  'need_data': 'Нужны данные',
  'result_ready': 'Результат готов',
  'returned': 'Возвращено',
  'manager_action': 'У менеджера',
  'done': 'Завершено',
  'cancelled': 'Отменено',
}

const TASK_STATUS = {
  open: { label: 'Открыта', color: A },
  in_progress: { label: 'В работе', color: INK },
  done: { label: 'Завершена', color: '#16A34A' },
  cancelled: { label: 'Отменена', color: M },
}

const PRIORITY = {
  normal: { label: 'Обычная', color: M },
  high: { label: 'Высокая', color: '#D97706' },
  critical: { label: 'Критичная', color: A },
}

const METRICS = [
  { key: 'myClients', label: 'Мои клиенты', view: 'clients', tab: 'mine' },
  { key: 'unassigned', label: 'Без менеджера', view: 'clients', tab: 'unassigned' },
  { key: 'newClients', label: 'Новые клиенты', view: 'clients', tab: 'new' },
  { key: 'openRequests', label: 'Открытые обращения', view: 'clients', tab: 'unresolved' },
  { key: 'notHelped', label: 'Не решённые', view: 'clients', tab: 'attention' },
  { key: 'unresolved', label: 'Не закрытые', view: 'clients', tab: 'unresolved' },
  { key: 'newMessages', label: 'Новые сообщения', view: 'clients', tab: 'mine' },
  { key: 'newTasks', label: 'Новые задачи', view: 'tasks', tab: 'open' },
  { key: 'noRequests', label: 'Без обращений', view: 'clients', tab: 'no-requests' },
  { key: 'tasksNoNextStep', label: 'Задачи без шага', view: 'tasks', tab: 'open' },
]

const CLIENT_TABS = [
  { id: 'mine', label: 'Мои' },
  { id: 'unassigned', label: 'Без менеджера' },
  { id: 'new', label: 'Новые' },
  { id: 'attention', label: 'Требуют внимания' },
  { id: 'no-requests', label: 'Без обращений' },
  { id: 'frequent', label: 'Частые' },
  { id: 'unresolved', label: 'Не решённые' },
]

const TASK_TABS = [
  { id: 'open', label: 'Открытые' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'done', label: 'Завершённые' },
  { id: 'cancelled', label: 'Отменённые' },
]

const STATUS_OPTIONS = [
  { id: 'unknown', label: 'Не определён' },
  { id: 'its_prof', label: '1С:ПРОФ' },
  { id: 'fresh_prof', label: '1С:ПРОФ (недавно)' },
  { id: 'other_regular', label: 'Другая ИТС' },
  { id: 'no_regular_contract', label: 'Нет договора' },
]

const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

export default function ManagerPanel({ user, showToast }) {
  const [section, setSection] = useState('dashboard')
  const [clientsTab, setClientsTab] = useState('mine')
  const [stats, setStats] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrgId, setSelectedOrgId] = useState(null)
  const [orgTab, setOrgTab] = useState('overview')
  const [orgDetail, setOrgDetail] = useState(null)
  const [orgLoading, setOrgLoading] = useState(false)
  const [tasksStatus, setTasksStatus] = useState('open')
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [taskResult, setTaskResult] = useState({})
  const [busy, setBusy] = useState({})

  const loadDashboard = useCallback(async () => {
    try {
      const data = await managerApi.dashboard()
      setStats(data.stats || {})
    } catch (e) {
      showToast('Ошибка загрузки сводки: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const loadClients = useCallback(async (tab) => {
    if (!tab) return
    try {
      const data = await managerApi.clients(tab)
      setOrgs(data.clients || [])
    } catch (e) {
      showToast('Ошибка загрузки клиентов: ' + e.message)
    }
  }, [showToast])

  const loadTasks = useCallback(async (status) => {
    setTasksLoading(true)
    try {
      const data = await managerApi.tasks(status)
      setTasks(data.tasks || [])
    } catch (e) {
      showToast('Ошибка загрузки задач: ' + e.message)
    } finally {
      setTasksLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (section === 'dashboard') loadDashboard()
    if (section === 'clients') loadClients(clientsTab)
    if (section === 'tasks') loadTasks(tasksStatus)
  }, [section, clientsTab, tasksStatus, loadDashboard, loadClients, loadTasks])

  const openOrg = async (id) => {
    setSelectedOrgId(id)
    setOrgTab('overview')
    setOrgLoading(true)
    setOrgDetail(null)
    try {
      const data = await managerApi.orgDetail(id)
      setOrgDetail(data)
    } catch (e) {
      showToast('Ошибка загрузки организации: ' + e.message)
    } finally {
      setOrgLoading(false)
    }
  }

  const backToClients = () => {
    setSelectedOrgId(null)
    setOrgDetail(null)
  }

  const goTo = (view, tab) => {
    setSection(view)
    if (tab) {
      if (view === 'clients') setClientsTab(tab)
      if (view === 'tasks') setTasksStatus(tab)
    }
  }

  const setBusyKey = (key, val) => setBusy(prev => ({ ...prev, [key]: val }))

  const handleServiceStatus = async (status) => {
    if (!orgDetail?.org || status === orgDetail.org.service_status) return
    setBusyKey('ss', true)
    try {
      await managerApi.serviceStatus(orgDetail.org.id, status)
      await openOrg(orgDetail.org.id)
      showToast('Статус обслуживания обновлён')
    } catch (e) {
      showToast(e.message || 'Не удалось обновить статус')
    } finally {
      setBusyKey('ss', false)
    }
  }

  const handleUserAction = async (orgId, userId, action) => {
    setBusyKey(`${orgId}-${userId}`, true)
    try {
      await managerApi.approveUser(orgId, userId, action)
      await openOrg(orgId)
      showToast(action === 'active' ? 'Пользователь подтверждён' : 'Заявка отклонена')
    } catch (e) {
      showToast(e.message || 'Не удалось обновить пользователя')
    } finally {
      setBusyKey(`${orgId}-${userId}`, false)
    }
  }

  const handleTaskUpdate = async (task, key) => {
    const value = taskResult[task.id]?.[key]
    if (key === 'next_step' && !value) return
    const data = {}
    data[key] = value
    if (key === 'result') data.status = 'done'
    setBusyKey(`task-${task.id}`, true)
    try {
      await managerApi.updateTask(task.id, data)
      setTaskResult(prev => ({ ...prev, [task.id]: {} }))
      await loadTasks(tasksStatus)
      showToast(key === 'result' ? 'Задача завершена' : 'Шаг задачи обновлён')
    } catch (e) {
      showToast(e.message || 'Не удалось обновить задачу')
    } finally {
      setBusyKey(`task-${task.id}`, false)
    }
  }

  const handleTaskStatus = async (task, status) => {
    setBusyKey(`taskstat-${task.id}`, true)
    try {
      await managerApi.updateTask(task.id, { status })
      await loadTasks(tasksStatus)
      showToast('Статус задачи обновлён')
    } catch (e) {
      showToast(e.message || 'Не удалось обновить задачу')
    } finally {
      setBusyKey(`taskstat-${task.id}`, false)
    }
  }

  const setField = (taskId, key, value) => {
    setTaskResult(prev => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), [key]: value } }))
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка рабочей панели…</div>
  }

  const renderOverview = () => {
    const org = orgDetail?.org
    if (!org) return null
    const st = SERVICE_STATUS[org.service_status] || SERVICE_STATUS.unknown
    const canEdit = user?.role !== 'manager' || org.manager_id === user.id
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 12 }}>Организация</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{org.name || '—'}</div>
          <div style={{ fontSize: 13, color: M, marginTop: 4 }}>ИНН: {org.inn || '—'}</div>
        </div>
        <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 12 }}>Менеджер</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{org.manager_name || 'Не назначен'}</div>
          {org.manager_email && <div style={{ fontSize: 13, color: M, marginTop: 4 }}>{org.manager_email}</div>}
        </div>
        <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 12 }}>Статус обслуживания</div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: S2, color: st.color }}>{st.label}</span>
          {canEdit && (
            <select
              value={org.service_status || 'unknown'}
              onChange={e => handleServiceStatus(e.target.value)}
              disabled={busy.ss}
              style={{ display: 'block', marginTop: 10, height: 32, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
            >
              {STATUS_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          )}
        </div>
      </div>
    )
  }

  const renderUsers = () => {
    const users = orgDetail?.users || []
    if (!users.length) return <div style={{ padding: 24, textAlign: 'center', color: M, fontSize: 14 }}>В организации нет пользователей</div>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{u.name || '—'}</div>
              <div style={{ fontSize: 13, color: M }}>{u.email || '—'} • {u.req_count || 0} обр.</div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: u.membership_status === 'pending' ? '#D97706' : u.membership_status === 'active' ? '#16A34A' : M }}>
                {u.membership_status === 'pending' ? 'На подтверждении' : u.membership_status === 'active' ? 'Подтверждён' : u.membership_status === 'rejected' ? 'Отклонён' : u.membership_status}
              </span>
            </div>
            {u.membership_status === 'pending' && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleUserAction(orgDetail.org.id, u.id, 'active')} disabled={busy[`${orgDetail.org.id}-${u.id}`]}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: INK, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Check size={14} /> Одобрить
                </button>
                <button onClick={() => handleUserAction(orgDetail.org.id, u.id, 'rejected')} disabled={busy[`${orgDetail.org.id}-${u.id}`]}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: S, color: A, border: `1px solid ${A}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <X size={14} /> Отклонить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderRequests = () => {
    const requests = orgDetail?.requests || []
    if (!requests.length) return <div style={{ padding: 24, textAlign: 'center', color: M, fontSize: 14 }}>Обращений пока нет</div>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {requests.map(r => (
          <div key={r.id} style={{ padding: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{r.title}</div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6, background: S2, color: r.status === 'done' ? '#16A34A' : A, flexShrink: 0 }}>
                {REQUEST_STATUS[r.status] || r.status}
              </span>
            </div>
            {r.description && <div style={{ fontSize: 13, color: M, marginTop: 6, lineHeight: 1.5 }}>{r.description}</div>}
            <div style={{ fontSize: 12, color: L, marginTop: 6 }}>{r.client_name || r.client_email || ''} • {formatDate(r.created_at)}</div>
          </div>
        ))}
      </div>
    )
  }

  const renderOrgTasks = () => {
    const tasks = orgDetail?.tasks || []
    if (!tasks.length) return <div style={{ padding: 24, textAlign: 'center', color: M, fontSize: 14 }}>Задач по организации нет</div>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map(t => {
          const ts = TASK_STATUS[t.status] || TASK_STATUS.open
          const pr = PRIORITY[t.priority] || PRIORITY.normal
          return (
            <div key={t.id} style={{ padding: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{t.description || 'Задача'}</div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: S2, color: pr.color, flexShrink: 0 }}>{pr.label}</span>
              </div>
              {(t.diagnosis || t.expected_result) && (
                <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {t.diagnosis && <div style={{ fontSize: 13, color: M }}>Диагноз: {t.diagnosis}</div>}
                  {t.expected_result && <div style={{ fontSize: 13, color: M }}>Ожидаемый результат: {t.expected_result}</div>}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ts.color }}>{ts.label}</span>
                {t.next_step && <div style={{ fontSize: 12, color: M }}>Шаг: {t.next_step}</div>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (selectedOrgId) {
    return (
      <div style={{ animation: 'fadeUp .4s ease both' }}>
        <button onClick={backToClients}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: M, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', marginBottom: 16, padding: '6px 12px 6px 8px', borderRadius: 6 }}>
          <ArrowLeft size={16} /> Назад к клиентам
        </button>
        {orgLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка организации…</div>
        ) : orgDetail && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.03em', color: INK, margin: 0 }}>{orgDetail.org?.name || 'Организация'}</h1>
              <div style={{ fontSize: 13, color: M, marginTop: 4 }}>ИНН {orgDetail.org?.inn || '—'}</div>
            </div>
            <div style={{ display: 'flex', gap: 2, marginBottom: 16, padding: 4, background: S2, borderRadius: 10, width: 'fit-content' }}>
              {[{ id: 'overview', label: 'Обзор' }, { id: 'users', label: `Пользователи (${(orgDetail.users || []).length})` }, { id: 'requests', label: `Обращения (${(orgDetail.requests || []).length})` }, { id: 'tasks', label: `Задачи (${(orgDetail.tasks || []).length})` }].map(t => (
                <button key={t.id} onClick={() => setOrgTab(t.id)}
                  style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: orgTab === t.id ? INK : M, background: orgTab === t.id ? S : 'transparent' }}>
                  {t.label}
                </button>
              ))}
            </div>
            {orgTab === 'overview' && renderOverview()}
            {orgTab === 'users' && renderUsers()}
            {orgTab === 'requests' && renderRequests()}
            {orgTab === 'tasks' && renderOrgTasks()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: A, marginBottom: 6 }}>РАБОЧЕЕ МЕСТО</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: INK, margin: 0 }}>АРМ Менеджера</h1>
        </div>
        <button onClick={() => { if (section === 'dashboard') loadDashboard(); if (section === 'clients') loadClients(clientsTab); if (section === 'tasks') loadTasks(tasksStatus) }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: S, color: INK, border: `1px solid ${BD}`, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, padding: 4, background: S2, borderRadius: 10, width: 'fit-content' }}>
        {[{ id: 'dashboard', label: 'Сводка' }, { id: 'clients', label: 'Клиенты' }, { id: 'tasks', label: 'Задачи' }].map(t => (
          <button key={t.id} onClick={() => goTo(t.id)}
            style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: section === t.id ? INK : M, background: section === t.id ? S : 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {section === 'dashboard' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
            {METRICS.map(m => (
              <div key={m.key} onClick={() => goTo(m.view, m.tab)} style={{ background: S, border: `1px solid ${BD}`, padding: 18, borderRadius: 10, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,0,113,.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: stats[m.key] > 0 ? A : INK }}>{stats[m.key] ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'clients' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {CLIENT_TABS.map(t => (
              <button key={t.id} onClick={() => setClientsTab(t.id)}
                style={{ fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 6, border: `1px solid ${clientsTab === t.id ? A : BD}`, cursor: 'pointer', fontFamily: 'inherit', color: clientsTab === t.id ? A : M, background: clientsTab === t.id ? '#FFF0F7' : S, transition: 'all .2s' }}>
                {t.label}
              </button>
            ))}
          </div>
          {orgs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <Building2 size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>В этой категории клиентов нет</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orgs.map(org => {
                const st = SERVICE_STATUS[org.service_status] || SERVICE_STATUS.unknown
                return (
                  <div key={org.id} onClick={() => openOrg(org.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: S, border: `1px solid ${BD}`, borderRadius: 10, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = A }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BD }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name || 'Организация'}</div>
                      <div style={{ fontSize: 13, color: M }}>ИНН: {org.inn || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: M, flexShrink: 0, flexWrap: 'wrap' }}>
                      <span>Обращений: <b style={{ color: INK }}>{org.req_count ?? 0}</b></span>
                      <span>Открыто: <b style={{ color: org.open_req > 0 ? A : INK }}>{org.open_req ?? 0}</b></span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: S2, color: st.color, flexShrink: 0 }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {section === 'tasks' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {TASK_TABS.map(t => (
              <button key={t.id} onClick={() => setTasksStatus(t.id)}
                style={{ fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 6, border: `1px solid ${tasksStatus === t.id ? A : BD}`, cursor: 'pointer', fontFamily: 'inherit', color: tasksStatus === t.id ? A : M, background: tasksStatus === t.id ? '#FFF0F7' : S, transition: 'all .2s' }}>
                {t.label}
              </button>
            ))}
          </div>
          {tasksLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка задач…</div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <ClipboardList size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Задач с этим статусом нет</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map(task => {
                const pr = PRIORITY[task.priority] || PRIORITY.normal
                const ts = TASK_STATUS[task.status] || TASK_STATUS.open
                const taskBusy = busy[`task-${task.id}`] || busy[`taskstat-${task.id}`]
                return (
                  <div key={task.id} style={{ padding: 16, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{task.description || 'Задача'}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6, background: S2, color: pr.color, flexShrink: 0 }}>{pr.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: M, marginTop: 4 }}>{task.org_name || '—'} • {task.client_name || task.client_email || ''}</div>
                    {(task.diagnosis || task.expected_result) && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: S2, borderRadius: 8, fontSize: 13, color: M, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {task.diagnosis && <div>Диагноз: {task.diagnosis}</div>}
                        {task.expected_result && <div>Ожидаемый результат: {task.expected_result}</div>}
                      </div>
                    )}
                    {task.next_step && <div style={{ fontSize: 12, color: M, marginTop: 8 }}>Следующий шаг: {task.next_step}</div>}
                    {task.result && <div style={{ fontSize: 12, color: '#16A34A', marginTop: 6 }}>Результат: {task.result}</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <select value={task.status} onChange={e => handleTaskStatus(task, e.target.value)} disabled={taskBusy}
                        style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: `1px solid ${BD}`, cursor: 'pointer', fontFamily: 'inherit', outline: 'none', background: S }}>
                        {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <input type="text" value={taskResult[task.id]?.next_step || ''} onChange={e => setField(task.id, 'next_step', e.target.value)} placeholder="Следующий шаг…"
                        style={{ height: 34, minWidth: 180, flex: 1, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                      <button onClick={() => handleTaskUpdate(task, 'next_step')} disabled={taskBusy || !(taskResult[task.id]?.next_step || '').trim()}
                        style={{ height: 34, padding: '0 14px', background: INK, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Шаг
                      </button>
                      <input type="text" value={taskResult[task.id]?.result || ''} onChange={e => setField(task.id, 'result', e.target.value)} placeholder="Результат…"
                        style={{ height: 34, minWidth: 180, flex: 1, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                      <button onClick={() => handleTaskUpdate(task, 'result')} disabled={taskBusy || !(taskResult[task.id]?.result || '').trim()}
                        style={{ height: 34, padding: '0 14px', background: S, color: '#16A34A', border: '1px solid #16A34A', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Результат
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: L, marginTop: 8 }}>{ts.label} • {formatDate(task.created_at)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}