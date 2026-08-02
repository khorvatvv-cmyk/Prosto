import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, RefreshCw, Building2, ClipboardList, Check, X, MessageCircle, Megaphone, Send } from 'lucide-react'
import { managerApi, chatApi, campaignApi } from '../api.js'

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

const CAMPAIGN_STATUS = {
  draft: { label: 'Черновик', color: M },
  active: { label: 'Активна', color: '#16A34A' },
  completed: { label: 'Завершена', color: '#2563EB' },
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

const CAMPAIGN_CATEGORIES = [
  { id: 'info', label: 'Информационная' },
  { id: 'promo', label: 'Промо' },
  { id: 'service', label: 'Сервисная' },
]

const CAMPAIGN_ACTIONS = [
  { id: 'none', label: 'Без действия' },
  { id: 'manager', label: 'Связаться с менеджером' },
  { id: 'connect', label: 'Подключиться' },
  { id: 'signup', label: 'Зарегистрироваться' },
]

const TARGET_STATUSES = [
  { id: 'all', label: 'Все' },
  { id: 'its_prof', label: '1С:ПРОФ' },
  { id: 'fresh_prof', label: '1С:ПРОФ (недавно)' },
  { id: 'other_regular', label: 'Другая ИТС' },
  { id: 'no_regular_contract', label: 'Нет договора' },
]

const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

const formatFullDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 12 }

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

  const [conversations, setConversations] = useState([])
  const [convosLoading, setConvosLoading] = useState(false)
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const pollRef = useRef(null)

  const [campaigns, setCampaigns] = useState([])
  const [campsLoading, setCampsLoading] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [campaignForm, setCampaignForm] = useState({ title: '', subject: '', short_text: '', full_text: '', category: 'info', action_type: 'none', action_label: '', start_date: '', end_date: '', target_status: 'all' })
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [activatingId, setActivatingId] = useState(null)
  const [activationResult, setActivationResult] = useState({})
  const [deliveriesFor, setDeliveriesFor] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [deliveriesLoading, setDeliveriesLoading] = useState(false)

  const [showClientMessage, setShowClientMessage] = useState(false)
  const [clientMsgText, setClientMsgText] = useState('')
  const [sendingClientMsg, setSendingClientMsg] = useState(false)

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

  const loadConversations = useCallback(async () => {
    setConvosLoading(true)
    try {
      const data = await chatApi.list()
      setConversations(data.conversations || [])
    } catch (e) {
      showToast('Ошибка загрузки чатов: ' + e.message)
    } finally {
      setConvosLoading(false)
    }
  }, [showToast])

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return
    setMsgLoading(true)
    try {
      const data = await chatApi.messages(convId)
      setMessages(data.messages || [])
    } catch (e) {
      showToast('Ошибка загрузки сообщений: ' + e.message)
    } finally {
      setMsgLoading(false)
    }
  }, [showToast])

  const loadCampaigns = useCallback(async () => {
    setCampsLoading(true)
    try {
      const data = await campaignApi.list()
      setCampaigns(data.campaigns || [])
    } catch (e) {
      showToast('Ошибка загрузки кампаний: ' + e.message)
    } finally {
      setCampsLoading(false)
    }
  }, [showToast])

  const loadDeliveries = useCallback(async (campaignId) => {
    setDeliveriesLoading(true)
    try {
      const data = await campaignApi.deliveries(campaignId)
      setDeliveries(data.deliveries || [])
    } catch (e) {
      showToast('Ошибка загрузки доставок: ' + e.message)
    } finally {
      setDeliveriesLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (section === 'dashboard') loadDashboard()
    if (section === 'clients') loadClients(clientsTab)
    if (section === 'tasks') loadTasks(tasksStatus)
    if (section === 'chats') loadConversations()
    if (section === 'campaigns') loadCampaigns()
  }, [section, clientsTab, tasksStatus, loadDashboard, loadClients, loadTasks, loadConversations, loadCampaigns])

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId)
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => {
        loadMessages(activeConvId)
      }, 5000)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [activeConvId, loadMessages])

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
    setShowClientMessage(false)
    setClientMsgText('')
  }

  const goTo = (view, tab) => {
    setSection(view)
    if (tab) {
      if (view === 'clients') setClientsTab(tab)
      if (view === 'tasks') setTasksStatus(tab)
    }
    setActiveConvId(null)
    setMessages([])
    setMsgText('')
    setShowCreateCampaign(false)
    setDeliveriesFor(null)
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

  const handleSendMessage = async () => {
    const text = msgText.trim()
    if (!text || !activeConvId) return
    setSendingMsg(true)
    try {
      await chatApi.send(text, activeConvId)
      setMsgText('')
      await loadMessages(activeConvId)
    } catch (e) {
      showToast(e.message || 'Не удалось отправить сообщение')
    } finally {
      setSendingMsg(false)
    }
  }

  const handleSendClientMessage = async () => {
    const text = clientMsgText.trim()
    if (!text) return
    setSendingClientMsg(true)
    try {
      await chatApi.send(text)
      setClientMsgText('')
      setShowClientMessage(false)
      showToast('Сообщение отправлено')
    } catch (e) {
      showToast(e.message || 'Не удалось отправить сообщение')
    } finally {
      setSendingClientMsg(false)
    }
  }

  const handleCampaignField = (key, value) => {
    setCampaignForm(prev => ({ ...prev, [key]: value }))
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.title.trim() || !campaignForm.full_text.trim()) {
      showToast('Заполните обязательные поля: название и полный текст')
      return
    }
    setCreatingCampaign(true)
    try {
      const data = { ...campaignForm }
      if (!data.start_date) delete data.start_date
      if (!data.end_date) delete data.end_date
      await campaignApi.create(data)
      setShowCreateCampaign(false)
      setCampaignForm({ title: '', subject: '', short_text: '', full_text: '', category: 'info', action_type: 'none', action_label: '', start_date: '', end_date: '', target_status: 'all' })
      await loadCampaigns()
      showToast('Кампания создана')
    } catch (e) {
      showToast(e.message || 'Не удалось создать кампанию')
    } finally {
      setCreatingCampaign(false)
    }
  }

  const handleActivateCampaign = async (id) => {
    setActivatingId(id)
    setActivationResult(prev => ({ ...prev, [id]: null }))
    try {
      const data = await campaignApi.activate(id)
      setActivationResult(prev => ({ ...prev, [id]: data }))
      await loadCampaigns()
    } catch (e) {
      showToast(e.message || 'Не удалось активировать кампанию')
    } finally {
      setActivatingId(null)
    }
  }

  const handleShowDeliveries = async (id) => {
    setDeliveriesFor(id)
    await loadDeliveries(id)
  }

  const handleKeyDown = (e, handler) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handler()
    }
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
          <div style={labelStyle}>Организация</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{org.name || '—'}</div>
          <div style={{ fontSize: 13, color: M, marginTop: 4 }}>ИНН: {org.inn || '—'}</div>
        </div>
        <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
          <div style={labelStyle}>Менеджер</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{org.manager_name || 'Не назначен'}</div>
          {org.manager_email && <div style={{ fontSize: 13, color: M, marginTop: 4 }}>{org.manager_email}</div>}
        </div>
        <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
          <div style={labelStyle}>Статус обслуживания</div>
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
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.03em', color: INK, margin: 0 }}>{orgDetail.org?.name || 'Организация'}</h1>
                <div style={{ fontSize: 13, color: M, marginTop: 4 }}>ИНН {orgDetail.org?.inn || '—'}</div>
              </div>
              <button onClick={() => setShowClientMessage(!showClientMessage)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px', background: A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                <MessageCircle size={14} /> Написать клиенту
              </button>
            </div>
            {showClientMessage && (
              <div style={{ marginBottom: 16, padding: 16, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: INK, marginBottom: 10 }}>Сообщение клиенту</div>
                <textarea
                  value={clientMsgText}
                  onChange={e => setClientMsgText(e.target.value)}
                  placeholder="Текст сообщения…"
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: `1px solid ${BD}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: 10 }}
                  onFocus={e => e.target.style.borderColor = A}
                  onBlur={e => e.target.style.borderColor = BD}
                  onKeyDown={e => handleKeyDown(e, handleSendClientMessage)}
                />
                <button onClick={handleSendClientMessage} disabled={sendingClientMsg || !clientMsgText.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px', background: INK, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Send size={14} /> {sendingClientMsg ? 'Отправка…' : 'Отправить'}
                </button>
              </div>
            )}
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
        <button onClick={() => { if (section === 'dashboard') loadDashboard(); if (section === 'clients') loadClients(clientsTab); if (section === 'tasks') loadTasks(tasksStatus); if (section === 'chats') loadConversations(); if (section === 'campaigns') loadCampaigns() }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: S, color: INK, border: `1px solid ${BD}`, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, padding: 4, background: S2, borderRadius: 10, width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: 'Сводка' },
          { id: 'clients', label: 'Клиенты' },
          { id: 'tasks', label: 'Задачи' },
          { id: 'chats', label: 'Чаты' },
          { id: 'campaigns', label: 'Кампании' },
        ].map(t => (
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

      {section === 'chats' && (
        <div>
          {activeConvId ? (
            <div>
              <button onClick={() => { setActiveConvId(null); setMessages([]); setMsgText('') }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: M, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', marginBottom: 16, padding: '6px 12px 6px 8px', borderRadius: 6 }}>
                <ArrowLeft size={16} /> Назад к списку чатов
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 260px)', minHeight: 400, background: S, border: `1px solid ${BD}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {msgLoading ? (
                    <div style={{ textAlign: 'center', color: M, padding: 40 }}>Загрузка сообщений…</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: M, padding: 40, fontSize: 14 }}>
                      <MessageCircle size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                      <div>Нет сообщений</div>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isManager = msg.role === 'manager'
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isManager ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: isManager ? A : S2,
                            color: isManager ? '#fff' : INK,
                            fontSize: 14,
                            lineHeight: 1.5,
                            borderBottomRightRadius: isManager ? 4 : 12,
                            borderBottomLeftRadius: isManager ? 12 : 4,
                          }}>
                            <div>{msg.text}</div>
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{formatDate(msg.created_at)}</div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${BD}`, background: S2 }}>
                  <input
                    type="text"
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, handleSendMessage)}
                    placeholder="Введите сообщение…"
                    style={{ flex: 1, height: 38, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = A}
                    onBlur={e => e.target.style.borderColor = BD}
                  />
                  <button onClick={handleSendMessage} disabled={sendingMsg || !msgText.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    <Send size={14} /> {sendingMsg ? '…' : ''}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {convosLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка чатов…</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
                  <MessageCircle size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div>Нет активных чатов</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {conversations.map(conv => (
                    <div key={conv.id} onClick={() => setActiveConvId(conv.id)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: S, border: `1px solid ${BD}`, borderRadius: 10, cursor: 'pointer', transition: 'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = A }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BD }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: A, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MessageCircle size={18} color="#fff" />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.client_name || 'Клиент'}</div>
                          {conv.unread_count > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: A, color: '#fff', flexShrink: 0 }}>
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: M }}>{conv.org_name || ''}{conv.org_inn ? ` • ИНН ${conv.org_inn}` : ''}</div>
                        {conv.last_message && <div style={{ fontSize: 12, color: L, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {section === 'campaigns' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>Кампании</div>
            <button onClick={() => { setShowCreateCampaign(!showCreateCampaign); setDeliveriesFor(null) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px', background: A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Megaphone size={14} /> Создать кампанию
            </button>
          </div>

          {showCreateCampaign && (
            <div style={{ marginBottom: 20, padding: 20, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: INK, marginBottom: 16 }}>Новая кампания</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Название *</div>
                  <input type="text" value={campaignForm.title} onChange={e => handleCampaignField('title', e.target.value)} placeholder="Название кампании"
                    style={{ width: '100%', height: 34, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Тема письма</div>
                  <input type="text" value={campaignForm.subject} onChange={e => handleCampaignField('subject', e.target.value)} placeholder="Тема"
                    style={{ width: '100%', height: 34, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Категория</div>
                  <select value={campaignForm.category} onChange={e => handleCampaignField('category', e.target.value)}
                    style={{ width: '100%', height: 34, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', boxSizing: 'border-box', background: S }}>
                    {CAMPAIGN_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Тип действия</div>
                  <select value={campaignForm.action_type} onChange={e => handleCampaignField('action_type', e.target.value)}
                    style={{ width: '100%', height: 34, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', boxSizing: 'border-box', background: S }}>
                    {CAMPAIGN_ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
                {campaignForm.action_type !== 'none' && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Текст кнопки</div>
                    <input type="text" value={campaignForm.action_label} onChange={e => handleCampaignField('action_label', e.target.value)} placeholder="Например: Связаться"
                      style={{ width: '100%', height: 34, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Целевые клиенты</div>
                  <select value={campaignForm.target_status} onChange={e => handleCampaignField('target_status', e.target.value)}
                    style={{ width: '100%', height: 34, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', boxSizing: 'border-box', background: S }}>
                    {TARGET_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Начало</div>
                  <input type="datetime-local" value={campaignForm.start_date} onChange={e => handleCampaignField('start_date', e.target.value)}
                    style={{ width: '100%', height: 34, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Окончание</div>
                  <input type="datetime-local" value={campaignForm.end_date} onChange={e => handleCampaignField('end_date', e.target.value)}
                    style={{ width: '100%', height: 34, border: `1px solid ${BD}`, borderRadius: 6, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Краткий текст</div>
                <textarea value={campaignForm.short_text} onChange={e => handleCampaignField('short_text', e.target.value)} placeholder="Краткое описание…" rows={2}
                  style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: `1px solid ${BD}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: M, marginBottom: 4 }}>Полный текст *</div>
                <textarea value={campaignForm.full_text} onChange={e => handleCampaignField('full_text', e.target.value)} placeholder="Полный текст кампании…" rows={4}
                  style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: `1px solid ${BD}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={handleCreateCampaign} disabled={creatingCampaign}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 20px', background: A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Megaphone size={14} /> {creatingCampaign ? 'Создание…' : 'Создать кампанию'}
                </button>
                <button onClick={() => setShowCreateCampaign(false)}
                  style={{ height: 36, padding: '0 16px', background: S, color: M, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Отмена
                </button>
              </div>
            </div>
          )}

          {deliveriesFor && (
            <div style={{ marginBottom: 20, padding: 20, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>Доставки кампании</div>
                <button onClick={() => { setDeliveriesFor(null); setDeliveries([]) }}
                  style={{ fontSize: 13, fontWeight: 500, color: M, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 4 }}>
                  ✕ Закрыть
                </button>
              </div>
              {deliveriesLoading ? (
                <div style={{ textAlign: 'center', color: M, padding: 20 }}>Загрузка доставок…</div>
              ) : deliveries.length === 0 ? (
                <div style={{ textAlign: 'center', color: M, padding: 20, fontSize: 14 }}>Нет доставок</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {deliveries.map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: S2, borderRadius: 8, fontSize: 13 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: INK }}>{d.user_name || '—'}</div>
                        <div style={{ color: M, fontSize: 12 }}>{d.org_name || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: L, flexShrink: 0, flexWrap: 'wrap' }}>
                        {d.delivered_at && <span>Доставлено: {formatDate(d.delivered_at)}</span>}
                        {d.opened_at && <span style={{ color: '#16A34A' }}>Открыто: {formatDate(d.opened_at)}</span>}
                        {d.clicked_at && <span style={{ color: A }}>Клик: {formatDate(d.clicked_at)}</span>}
                        {d.hidden && <span style={{ color: M }}>Скрыто</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {campsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка кампаний…</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <Megaphone size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Нет созданных кампаний</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {campaigns.map(camp => {
                const cs = CAMPAIGN_STATUS[camp.status] || CAMPAIGN_STATUS.draft
                const activated = activationResult[camp.id]
                return (
                  <div key={camp.id} style={{ padding: 16, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{camp.title}</div>
                        <div style={{ fontSize: 13, color: M, marginTop: 2 }}>
                          {CAMPAIGN_CATEGORIES.find(c => c.id === camp.category)?.label || camp.category}
                          {camp.author && <span> • {camp.author}</span>}
                        </div>
                        {(camp.start_date || camp.end_date) && (
                          <div style={{ fontSize: 12, color: L, marginTop: 2 }}>
                            {camp.start_date ? formatFullDate(camp.start_date) : ''}
                            {camp.start_date && camp.end_date ? ' – ' : ''}
                            {camp.end_date ? formatFullDate(camp.end_date) : ''}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6, background: S2, color: cs.color, flexShrink: 0 }}>{cs.label}</span>
                    </div>
                    {camp.subject && <div style={{ fontSize: 13, color: M, marginTop: 8 }}>Тема: {camp.subject}</div>}
                    {camp.short_text && <div style={{ fontSize: 13, color: M, marginTop: 4 }}>{camp.short_text}</div>}
                    {activated && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: '#F0FDF4', borderRadius: 8, fontSize: 13, color: '#16A34A', fontWeight: 600 }}>
                        Кампания активирована! Доставлено: {activated.delivered ?? activated.count ?? '—'}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {camp.status === 'draft' && (
                        <button onClick={() => handleActivateCampaign(camp.id)} disabled={activatingId === camp.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {activatingId === camp.id ? 'Активация…' : 'Активировать'}
                        </button>
                      )}
                      <button onClick={() => handleShowDeliveries(camp.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: S, color: INK, border: `1px solid ${BD}`, borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Доставки
                      </button>
                    </div>
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
