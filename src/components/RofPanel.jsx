import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Search, Building2, Users, Megaphone, Activity, ClipboardList } from 'lucide-react'
import { rofApi, managerApi, campaignApi } from '../api.js'

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

const STATUS_LABELS = {
  'waiting': 'Ожидает специалиста',
  'in_progress': 'В работе',
  'need_data': 'Нужны данные',
  'result_ready': 'Результат готов',
  'returned': 'Возвращено',
  'manager_action': 'У менеджера',
  'done': 'Завершено',
}

const L1_FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'waiting', label: 'Ожидают специалиста' },
  { id: 'in-progress', label: 'В работе' },
  { id: 'need-data', label: 'Нужны данные' },
  { id: 'result-ready', label: 'Результат готов' },
  { id: 'returned', label: 'Возвращено' },
  { id: 'manager-action', label: 'У менеджера' },
]

const CAMPAIGN_STATUS = {
  draft: { label: 'Черновик', color: M },
  active: { label: 'Активна', color: '#16A34A' },
  completed: { label: 'Завершена', color: M },
}

const TARGET_STATUS = {
  unknown: 'Все клиенты',
  its_prof: '1С:ПРОФ',
  fresh_prof: '1С:ПРОФ (недавно)',
  other_regular: 'Другая ИТС',
  no_regular_contract: 'Нет договора',
}

const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

export default function RofPanel({ showToast }) {
  const [section, setSection] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [assignFor, setAssignFor] = useState(null)
  const [busy, setBusy] = useState({})
  const [l1Filter, setL1Filter] = useState('all')
  const [l1Queue, setL1Queue] = useState([])
  const [l1Loading, setL1Loading] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [campaignForm, setCampaignForm] = useState({ title: '', subject: '', short_text: '', full_text: '', category: 'info', action_label: '', action_type: '', target_status: 'unknown', start_date: '', end_date: '' })
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [deliveries, setDeliveries] = useState(null)
  const [deliveriesLoading, setDeliveriesLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const data = await rofApi.dashboard()
      setStats(data.stats || {})
      setManagers(data.managers || [])
    } catch (e) {
      showToast('Ошибка загрузки сводки: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const loadClients = useCallback(async (q) => {
    setClientsLoading(true)
    try {
      const data = await rofApi.clients(q || '')
      setClients(data.clients || [])
    } catch (e) {
      showToast('Ошибка загрузки клиентов: ' + e.message)
    } finally {
      setClientsLoading(false)
    }
  }, [showToast])

  const loadL1 = useCallback(async (filter) => {
    setL1Loading(true)
    try {
      const data = await rofApi.l1Queue(filter)
      setL1Queue(data.requests || [])
    } catch (e) {
      showToast('Ошибка загрузки очереди L1: ' + e.message)
    } finally {
      setL1Loading(false)
    }
  }, [showToast])

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true)
    try {
      const data = await campaignApi.list()
      setCampaigns(data.campaigns || [])
    } catch (e) {
      showToast('Ошибка загрузки кампаний: ' + e.message)
    } finally {
      setCampaignsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (section === 'clients') loadClients(search)
    if (section === 'l1') loadL1(l1Filter)
    if (section === 'campaigns') loadCampaigns()
  }, [section, search, l1Filter, loadClients, loadL1, loadCampaigns])

  const setBusyKey = (key, val) => setBusy(prev => ({ ...prev, [key]: val }))

  const handleAssign = async (orgId) => {
    const managerId = assignFor
    if (!managerId) { showToast('Выберите менеджера'); return }
    setBusyKey(`a-${orgId}`, true)
    try {
      await managerApi.assignOrg(orgId, Number(managerId))
      setAssignFor(null)
      await loadClients(search)
      showToast('Клиент назначен менеджеру')
    } catch (e) {
      showToast(e.message || 'Не удалось назначить менеджера')
    } finally {
      setBusyKey(`a-${orgId}`, false)
    }
  }

  const handleUnassign = async (orgId) => {
    setBusyKey(`u-${orgId}`, true)
    try {
      await managerApi.unassignOrg(orgId)
      await loadClients(search)
      showToast('Менеджер снят с клиента')
    } catch (e) {
      showToast(e.message || 'Не удалось снять менеджера')
    } finally {
      setBusyKey(`u-${orgId}`, false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput.trim())
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.title.trim() || !campaignForm.full_text.trim()) { showToast('Заголовок и текст обязательны'); return }
    setCreatingCampaign(true)
    try {
      await campaignApi.create({ ...campaignForm, title: campaignForm.title.trim(), full_text: campaignForm.full_text.trim() })
      setCampaignForm({ title: '', subject: '', short_text: '', full_text: '', category: 'info', action_label: '', action_type: '', target_status: 'unknown', start_date: '', end_date: '' })
      setShowCreateCampaign(false)
      await loadCampaigns()
      showToast('Кампания создана')
    } catch (e) {
      showToast(e.message || 'Не удалось создать кампанию')
    } finally {
      setCreatingCampaign(false)
    }
  }

  const handleActivate = async (id) => {
    setBusyKey(`act-${id}`, true)
    try {
      const data = await campaignApi.activate(id)
      await loadCampaigns()
      showToast(`Кампания запущена: ${data.delivered || 0} доставок`)
    } catch (e) {
      showToast(e.message || 'Не удалось активировать кампанию')
    } finally {
      setBusyKey(`act-${id}`, false)
    }
  }

  const openDeliveries = async (id) => {
    setDeliveries(id)
    setDeliveriesLoading(true)
    try {
      const data = await campaignApi.deliveries(id)
      setDeliveries({ campaignId: id, items: data.deliveries || [] })
    } catch (e) {
      showToast('Ошибка загрузки доставок: ' + e.message)
      setDeliveries(null)
    } finally {
      setDeliveriesLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка панели РОФ…</div>
  }

  const setFormField = (key, value) => setCampaignForm(prev => ({ ...prev, [key]: value }))

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: A, marginBottom: 6 }}>РАБОЧЕЕ МЕСТО</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: INK, margin: 0 }}>РОФ</h1>
        </div>
        <button onClick={() => loadDashboard()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: S, color: INK, border: `1px solid ${BD}`, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, padding: 4, background: S2, borderRadius: 10, width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}>
        {[{ id: 'dashboard', label: 'Сводка' }, { id: 'clients', label: 'Клиенты' }, { id: 'l1', label: 'Очередь L1' }, { id: 'campaigns', label: 'Кампании' }].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)}
            style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: section === t.id ? INK : M, background: section === t.id ? S : 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {section === 'dashboard' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Организации', value: stats.orgs, color: INK },
              { label: 'Менеджеры', value: stats.managers, color: INK },
              { label: 'Без менеджера', value: stats.unassigned, color: stats.unassigned > 0 ? A : INK },
              { label: 'Открытые обращения', value: stats.openRequests, color: stats.openRequests > 0 ? A : INK },
              { label: 'Не решённые', value: stats.notHelped, color: stats.notHelped > 0 ? A : INK },
              { label: 'Очередь L1', value: stats.l1Queue, color: stats.l1Queue > 0 ? A : INK },
              { label: 'Открытые задачи', value: stats.openTasks, color: stats.openTasks > 0 ? A : INK },
            ].map((m, i) => (
              <div key={i} style={{ background: S, border: `1px solid ${BD}`, padding: 18, borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value ?? 0}</div>
              </div>
            ))}
          </div>

          <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, overflowX: 'auto' }}>
            <div style={{ padding: 18, borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color={M} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: INK, margin: 0 }}>Менеджеры</h3>
            </div>
            <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BD}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Имя</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Клиенты</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Открытые обращения</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>Открытые задачи</th>
                </tr>
              </thead>
              <tbody>
                {managers.map(m => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${S2}` }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: INK }}>{m.name || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: M }}>{m.email || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: INK }}>{m.client_count ?? 0}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: m.open_requests > 0 ? A : INK }}>{m.open_requests ?? 0}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: m.open_tasks > 0 ? A : INK }}>{m.open_tasks ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {managers.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>Менеджеров ещё нет</div>}
          </div>
        </div>
      )}

      {section === 'clients' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Поиск по ИНН или названию…"
              style={{ flex: 1, maxWidth: 420, height: 38, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
            <button onClick={handleSearch} style={{ height: 38, padding: '0 14px', background: S, color: INK, border: `1px solid ${BD}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Search size={15} /> Найти
            </button>
          </div>
          {clientsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка клиентов…</div>
          ) : clients.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <Building2 size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Клиенты не найдены</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clients.map(org => {
                const st = SERVICE_STATUS[org.service_status] || SERVICE_STATUS.unknown
                return (
                  <div key={org.id} style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{org.name || 'Организация'}</div>
                        <div style={{ fontSize: 13, color: M }}>ИНН: {org.inn || '—'} • {org.manager_name ? `Менеджер: ${org.manager_name}` : 'Без менеджера'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: M, flexShrink: 0 }}>
                        <span>Обращений: <b style={{ color: INK }}>{org.req_count ?? 0}</b></span>
                        <span>Открыто: <b style={{ color: org.open_req > 0 ? A : INK }}>{org.open_req ?? 0}</b></span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: S2, color: st.color, flexShrink: 0 }}>{st.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                      {!org.manager_id && (
                        <>
                          <select value={assignFor || ''} onChange={e => setAssignFor(e.target.value)}
                            style={{ height: 34, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                            <option value="">Назначить менеджера…</option>
                            {managers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                          </select>
                          <button onClick={() => handleAssign(org.id)} disabled={busy[`a-${org.id}`] || !assignFor}
                            style={{ height: 34, padding: '0 14px', background: INK, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {busy[`a-${org.id}`] ? 'Назначение…' : 'Назначить'}
                          </button>
                        </>
                      )}
                      {org.manager_id && (
                        <button onClick={() => handleUnassign(org.id)} disabled={busy[`u-${org.id}`]}
                          style={{ height: 34, padding: '0 14px', background: S, color: A, border: `1px solid ${A}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {busy[`u-${org.id}`] ? 'Снятие…' : 'Снять менеджера'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {section === 'l1' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {L1_FILTERS.map(f => (
              <button key={f.id} onClick={() => setL1Filter(f.id)}
                style={{ fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 6, border: `1px solid ${l1Filter === f.id ? A : BD}`, cursor: 'pointer', fontFamily: 'inherit', color: l1Filter === f.id ? A : M, background: l1Filter === f.id ? '#FFF0F7' : S, transition: 'all .2s' }}>
                {f.label}
              </button>
            ))}
          </div>
          {l1Loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка очереди…</div>
          ) : l1Queue.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <Activity size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>В очереди L1 нет обращений</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {l1Queue.map(r => (
                <div key={r.id} style={{ padding: 16, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{r.title}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6, background: S2, color: r.status === 'done' ? '#16A34A' : A, flexShrink: 0 }}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: M, marginTop: 6 }}>{r.client_name || r.client_email || '—'}{r.client_inn ? ` • ИНН ${r.client_inn}` : ''}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: L, marginTop: 6, flexWrap: 'wrap' }}>
                    {r.org_name && <span>{r.org_name}</span>}
                    {r.specialist_name && <span>Специалист: {r.specialist_name}</span>}
                    <span>{formatDate(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {section === 'campaigns' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: 0 }}>Кампании</h3>
            <button onClick={() => setShowCreateCampaign(!showCreateCampaign)}
              style={{ height: 38, padding: '0 16px', background: A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Megaphone size={15} /> Создать кампанию
            </button>
          </div>

          {showCreateCampaign && (
            <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: INK, marginTop: 0 }}>Новая кампания</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <input type="text" value={campaignForm.title} onChange={e => setFormField('title', e.target.value)} placeholder="Заголовок (обязательно)"
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                <input type="text" value={campaignForm.subject} onChange={e => setFormField('subject', e.target.value)} placeholder="Тема письма"
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                <input type="text" value={campaignForm.short_text} onChange={e => setFormField('short_text', e.target.value)} placeholder="Краткий текст"
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                <input type="text" value={campaignForm.category} onChange={e => setFormField('category', e.target.value)} placeholder="Категория (напр. info)"
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                <input type="text" value={campaignForm.action_label} onChange={e => setFormField('action_label', e.target.value)} placeholder="Подпись кнопки действия"
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                <input type="text" value={campaignForm.action_type} onChange={e => setFormField('action_type', e.target.value)} placeholder="Тип действия (напр. contact)"
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                <select value={campaignForm.target_status} onChange={e => setFormField('target_status', e.target.value)}
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  {Object.entries(TARGET_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input type="date" value={campaignForm.start_date} onChange={e => setFormField('start_date', e.target.value)} placeholder="Дата старта"
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                <input type="date" value={campaignForm.end_date} onChange={e => setFormField('end_date', e.target.value)} placeholder="Дата окончания"
                  style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              </div>
              <textarea value={campaignForm.full_text} onChange={e => setFormField('full_text', e.target.value)} placeholder="Полный текст (обязательно)…"
                style={{ width: '100%', minHeight: 100, resize: 'vertical', border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6, marginTop: 12 }}
                onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
              <button onClick={handleCreateCampaign} disabled={creatingCampaign || !campaignForm.title.trim() || !campaignForm.full_text.trim()}
                style={{ marginTop: 12, height: 44, padding: '0 24px', background: creatingCampaign ? S2 : A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: creatingCampaign ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {creatingCampaign ? 'Создание…' : 'Создать'}
              </button>
            </div>
          )}

          {campaignsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка кампаний…</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <ClipboardList size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Кампаний пока нет</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {campaigns.map(c => {
                const cs = CAMPAIGN_STATUS[c.status] || CAMPAIGN_STATUS.draft
                return (
                  <div key={c.id} style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{c.title}</div>
                        <div style={{ fontSize: 13, color: M, marginTop: 4 }}>{c.subject || ''} • Автор: {c.author_name || '—'}</div>
                        {c.target_status && <div style={{ fontSize: 12, color: L, marginTop: 2 }}>Цель: {TARGET_STATUS[c.target_status] || c.target_status}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6, background: S2, color: cs.color }}>{cs.label}</span>
                        <button onClick={() => openDeliveries(c.id)} style={{ height: 32, padding: '0 12px', background: S, color: INK, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Доставки
                        </button>
                        {c.status === 'draft' && (
                          <button onClick={() => handleActivate(c.id)} disabled={busy[`act-${c.id}`]}
                            style={{ height: 32, padding: '0 12px', background: INK, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {busy[`act-${c.id}`] ? 'Запуск…' : 'Активировать'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {deliveries && (
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setDeliveries(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: M, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', marginBottom: 12, padding: 0 }}>
                ← Назад к кампаниям
              </button>
              {deliveriesLoading ? (
                <div style={{ padding: 30, textAlign: 'center', color: M }}>Загрузка доставок…</div>
              ) : (
                <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, overflowX: 'auto' }}>
                  <div style={{ padding: 16, borderBottom: `1px solid ${BD}` }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: INK, margin: 0 }}>Доставки ({deliveries.items.length})</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {deliveries.items.map(d => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${S2}` }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{d.org_name || '—'}</div>
                          <div style={{ fontSize: 12, color: L }}>ИНН {d.org_inn || '—'}</div>
                        </div>
                        <div style={{ fontSize: 13, color: M }}>{d.user_name || d.user_email || '—'}</div>
                        <div style={{ fontSize: 12, color: L }}>{formatDate(d.delivered_at) || formatDate(d.created_at)}</div>
                      </div>
                    ))}
                    {deliveries.items.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: M }}>Доставок ещё нет</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
