import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Send, ClipboardList, UserCheck, FileQuestion, CheckCircle2, RotateCcw, Lock, Search, ArrowLeftRight, MessageCircle } from 'lucide-react'
import { specialistApi } from '../api.js'
import { AnimatedTabs, CompactTimeline, GlowingCard, HoverGroup, HoverItem, StatefulButton } from './ui/AceternityEffects.jsx'

function formatMessageText(text) {
  if (!text) return null
  const paragraphs = text.split(/\n+/).filter(p => p.trim())
  if (!paragraphs.length) return text
  return paragraphs.map((p, i) => (
    <p key={i} style={{ margin: i > 0 ? '10px 0 0' : '0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{p}</p>
  ))
}

const STATUS_LABELS = {
  'open': 'Открыто',
  'waiting': 'Ожидает специалиста',
  'in_progress': 'Специалист работает',
  'need_data': 'Нужны данные',
  'result_ready': 'Результат готов',
  'returned': 'Возвращено в работу',
  'done': 'Завершено',
}

const STATUS_COLORS = {
  'waiting': '#E50071',
  'in_progress': '#18181B',
  'need_data': '#E50071',
  'result_ready': '#16A34A',
  'returned': '#E50071',
  'done': '#6B6B70',
  'open': '#18181B',
}

const FILTERS = [
  { id: 'waiting', label: 'Ожидают специалиста' },
  { id: 'in-progress', label: 'В работе' },
  { id: 'need-data', label: 'Нужны данные' },
  { id: 'result-ready', label: 'Результат готов' },
  { id: 'returned', label: 'Возвращено' },
  { id: 'done', label: 'Завершённые' },
]

const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

export default function SpecialistPanel({ user, showToast }) {
  const [tab, setTab] = useState('queue')
  const [filter, setFilter] = useState('waiting')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [queue, setQueue] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [noteText, setNoteText] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferReason, setTransferReason] = useState('')
  const [transferDiagnosis, setTransferDiagnosis] = useState('')
  const [transferExpected, setTransferExpected] = useState('')
  const [transferPriority, setTransferPriority] = useState('normal')
  const [clientChatMessages, setClientChatMessages] = useState([])
  const [clientChatLoading, setClientChatLoading] = useState(false)

  const A = '#E50071', INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'

  const loadQueue = useCallback(async () => {
    try {
      const data = await specialistApi.queue(filter, search)
      setQueue(data.requests || [])
    } catch (e) {
      console.error('Queue load error:', e)
    }
  }, [filter, search])

  const loadMyRequests = useCallback(async () => {
    try {
      const data = await specialistApi.myRequests()
      setMyRequests(data.requests || [])
    } catch (e) {
      console.error('My requests load error:', e)
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadQueue(), loadMyRequests()])
    setLoading(false)
  }, [loadQueue, loadMyRequests])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (tab !== 'detail') {
      const interval = setInterval(() => {
        loadQueue()
        loadMyRequests()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [tab, loadQueue, loadMyRequests])

  const openRequest = async (id) => {
    setTab('detail')
    setSelectedRequest(id)
    setDetailLoading(true)
    setDetailData(null)
    setClientChatMessages([])
    try {
      const data = await specialistApi.requestDetail(id)
      setDetailData(data)
      if (data?.request?.user_id) {
        loadClientChat(data.request.user_id)
      }
    } catch (e) {
      showToast('Ошибка загрузки обращения: ' + e.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const loadClientChat = async (userId) => {
    if (!userId) return
    setClientChatLoading(true)
    try {
      const data = await specialistApi.clientChat(userId)
      setClientChatMessages(data.messages || [])
    } catch (e) {
      console.error('Client chat load error:', e)
    } finally {
      setClientChatLoading(false)
    }
  }

  const refreshDetail = async () => {
    if (!selectedRequest) return
    try {
      const data = await specialistApi.requestDetail(selectedRequest)
      setDetailData(data)
    } catch (e) {
      console.error('Refresh detail error:', e)
    }
  }

  const handleTake = async () => {
    setActionLoading(true)
    try {
      await specialistApi.take(selectedRequest)
      await refreshDetail()
      showToast('Обращение принято в работу')
      return true
    } catch (e) {
      showToast(e.message || 'Не удалось взять обращение')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  const handleRelease = async () => {
    setActionLoading(true)
    try {
      await specialistApi.release(selectedRequest)
      await refreshDetail()
      showToast('Обращение возвращено в очередь')
    } catch (e) {
      showToast(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendMessage = async () => {
    const text = replyText.trim()
    if (!text) return
    setActionLoading(true)
    try {
      await specialistApi.sendMessage(selectedRequest, text)
      setReplyText('')
      await refreshDetail()
    } catch (e) {
      showToast(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleInternalNote = async () => {
    const text = noteText.trim()
    if (!text) return
    setActionLoading(true)
    try {
      await specialistApi.internalNote(selectedRequest, text)
      setNoteText('')
      setShowNote(false)
      await refreshDetail()
    } catch (e) {
      showToast(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleNeedData = async () => {
    const text = replyText.trim()
    setActionLoading(true)
    try {
      await specialistApi.needData(selectedRequest, text)
      setReplyText('')
      await refreshDetail()
      showToast('Запрошены данные у клиента')
    } catch (e) {
      showToast(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResult = async () => {
    const text = replyText.trim()
    if (!text) { showToast('Введите результат перед отправкой'); return }
    setActionLoading(true)
    try {
      await specialistApi.result(selectedRequest, text)
      setReplyText('')
      await refreshDetail()
      showToast('Результат передан клиенту')
    } catch (e) {
      showToast(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTransfer = async () => {
    const reason = transferReason.trim()
    if (!reason) { showToast('Укажите причину передачи'); return }
    setActionLoading(true)
    try {
      await specialistApi.transferToManager(selectedRequest, {
        reason,
        diagnosis: transferDiagnosis.trim(),
        expected_result: transferExpected.trim(),
        priority: transferPriority,
      })
      setShowTransfer(false)
      setTransferReason('')
      setTransferDiagnosis('')
      setTransferExpected('')
      setTransferPriority('normal')
      await refreshDetail()
      showToast('Обращение передано менеджеру')
    } catch (e) {
      showToast(e.message || 'Не удалось передать менеджеру')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput.trim())
  }

  if (loading && tab !== 'detail') {
    return <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка рабочей панели…</div>
  }

  if (tab === 'detail' && selectedRequest) {
    const r = detailData?.request
    const messages = detailData?.messages || []
    const isAssigned = r?.assigned_to === user.id || user.role === 'admin'
    const isWaiting = r?.status === 'waiting' || r?.status === 'returned'
    const isActive = r?.status === 'in_progress' || r?.status === 'need_data' || r?.status === 'result_ready' || r?.status === 'returned'
    const canAct = isAssigned && isActive && r?.status !== 'done'
    const isDone = r?.status === 'done'

    return (
      <div style={{ animation: 'fadeUp .4s ease both' }}>
        <button onClick={() => { setTab('queue'); setSelectedRequest(null); setDetailData(null); loadAll() }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: M, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', marginBottom: 16, padding: '6px 12px 6px 8px', borderRadius: 6 }}>
          <ArrowLeft size={16} /> Назад к очереди
        </button>

        {detailLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка обращения…</div>
        ) : r && (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* LEFT — client info */}
            <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <GlowingCard style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 12 }}>Клиент</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4 }}>{r.client_name || r.client_email || '—'}</div>
                <div style={{ fontSize: 13, color: M, marginBottom: 2 }}>{r.client_email || '—'}</div>
                <div style={{ fontSize: 13, color: M, marginBottom: 2 }}>ИНН: {r.client_inn || '—'}</div>
                {r.client_organization && <div style={{ fontSize: 13, color: M }}>{r.client_organization}</div>}
              </GlowingCard>

              <GlowingCard style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 12 }}>Программа</div>
                {[
                  { label: 'Вид деятельности', value: r.activity_type },
                  { label: 'Продукт', value: r.software_product },
                  { label: 'Версия', value: r.product_version },
                  { label: 'Конфигурация', value: r.config_type },
                  { label: 'Доработки', value: r.customizations },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', fontSize: 13 }}>
                    <span style={{ color: M }}>{label}</span>
                    <span style={{ color: INK, textAlign: 'right', maxWidth: 160 }}>{value || '—'}</span>
                  </div>
                ))}
              </GlowingCard>

              <GlowingCard style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>Статус</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: STATUS_COLORS[r.status] || INK }}>{STATUS_LABELS[r.status] || r.status}</span>
                {r.specialist_name && <div style={{ fontSize: 12, color: M, marginTop: 4 }}>Специалист: {r.specialist_name}</div>}
              </GlowingCard>

              {!isAssigned && !isDone && !isWaiting && (
                <div style={{ fontSize: 13, color: M, padding: 14, background: S2, borderRadius: 8 }}>
                  Это обращение взял другой специалист.
                </div>
              )}
            </div>

            {/* RIGHT — messages and actions */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <GlowingCard spotlight active style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 4 }}>{r.title}</h3>
                <div style={{ fontSize: 13, color: M }}>Создано: {formatDate(r.created_at)}</div>
                {r.description && <div style={{ fontSize: 14, color: INK, marginTop: 10, lineHeight: 1.6 }}>{r.description}</div>}
                <CompactTimeline request={r} />
              </GlowingCard>

              <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 16, maxHeight: 400, overflowY: 'auto' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    marginBottom: 10, padding: '12px 16px', borderRadius: 8,
                    background: msg.is_internal ? '#FFFBEB' : msg.sender === 'system' ? S2 : S,
                    border: `1px solid ${msg.is_internal ? '#FDE68A' : BD}`,
                    opacity: msg.is_internal ? 0.9 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em',
                        color: msg.is_internal ? '#D97706' : msg.sender === 'assistant' ? A : msg.sender === 'user' ? L : msg.sender === 'specialist' ? '#16A34A' : M }}>
                        {msg.is_internal ? 'Внутренняя заметка' : msg.sender === 'assistant' ? 'Ассистент ПРОСТО' : msg.sender === 'user' ? 'Клиент' : msg.sender === 'specialist' ? 'Специалист' : 'Система'}
                      </span>
                      <span style={{ fontSize: 11, color: L }}>{formatDate(msg.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 14, color: INK, lineHeight: 1.6 }}>
                      {msg.sender === 'assistant' ? formatMessageText(msg.text) : msg.text}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <div style={{ color: M, fontSize: 14 }}>Нет сообщений</div>}
              </div>

              {clientChatMessages.length > 0 && (
                <div style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <MessageCircle size={16} color={A} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>Переписка клиента с менеджером</div>
                  </div>
                  {clientChatLoading ? (
                    <div style={{ textAlign: 'center', color: M, padding: 20 }}>Загрузка…</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                      {clientChatMessages.map((msg, i) => {
                        const isClient = msg.role === 'user' || msg.sender_id === clientChatMessages._user_id
                        return (
                          <div key={msg.id || i} style={{
                            padding: '8px 12px', borderRadius: 8, fontSize: 13, lineHeight: 1.5,
                            background: isClient ? S2 : '#FFF0F7',
                            border: `1px solid ${isClient ? BD : '#FBCFE8'}`,
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: M, marginBottom: 2 }}>
                              {isClient ? 'Клиент' : msg.sender_name || 'Менеджер'}
                            </div>
                            <div style={{ color: INK }}>{msg.text}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {isWaiting && !isAssigned && (
                <StatefulButton onAction={handleTake} loadingText="Принимаем…" successText="Принято" disabled={actionLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', background: actionLoading ? S2 : A, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  <UserCheck size={18} /> Взять в работу
                </StatefulButton>
              )}

              {canAct && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={handleSendMessage} disabled={actionLoading || !replyText.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: replyText.trim() ? INK : S2, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Send size={15} /> Ответить клиенту
                    </button>
                    <button onClick={handleNeedData} disabled={actionLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: S, color: INK, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <FileQuestion size={15} /> Запросить данные
                    </button>
                    <button onClick={handleResult} disabled={actionLoading || !replyText.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: S, color: '#16A34A', border: '1px solid #16A34A', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <CheckCircle2 size={15} /> Результат готов
                    </button>
                    <button onClick={() => setShowNote(!showNote)} disabled={actionLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: S, color: M, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Lock size={15} /> Заметка
                    </button>
                    <button onClick={handleRelease} disabled={actionLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: S, color: M, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <RotateCcw size={15} /> Вернуть в очередь
                    </button>
                    <button onClick={() => setShowTransfer(!showTransfer)} disabled={actionLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: showTransfer ? '#FFF0F7' : S, color: A, border: showTransfer ? `1px solid ${A}` : `1px solid ${A}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <ArrowLeftRight size={15} /> Передать менеджеру
                    </button>
                  </div>

                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Текст ответа клиенту…"
                    style={{ width: '100%', minHeight: 80, resize: 'vertical', border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = A}
                    onBlur={e => e.target.style.borderColor = BD} />

                  {showNote && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder="Внутренняя заметка (не видна клиенту)…"
                        style={{ flex: 1, minHeight: 60, resize: 'vertical', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6, background: '#FFFBEB' }} />
                      <button onClick={handleInternalNote} disabled={actionLoading || !noteText.trim()}
                        style={{ height: 38, padding: '0 16px', background: noteText.trim() ? '#D97706' : S2, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        Сохранить заметку
                      </button>
                    </div>
                  )}

                  {showTransfer && (
                    <div style={{ background: '#FFF0F7', border: `1px solid ${A}`, borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 12 }}>Передача обращения менеджеру</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input type="text" value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="Причина выхода за границы L1 (обязательно)"
                          style={{ height: 40, border: `1px solid ${transferReason ? BD : A}`, borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                        <input type="text" value={transferDiagnosis} onChange={e => setTransferDiagnosis(e.target.value)} placeholder="Диагноз"
                          style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                        <input type="text" value={transferExpected} onChange={e => setTransferExpected(e.target.value)} placeholder="Ожидаемый результат"
                          style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = A} onBlur={e => e.target.style.borderColor = BD} />
                        <select value={transferPriority} onChange={e => setTransferPriority(e.target.value)}
                          style={{ height: 40, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 10px', fontSize: 14, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                          <option value="normal">Обычный приоритет</option>
                          <option value="high">Высокий приоритет</option>
                          <option value="critical">Критичный</option>
                        </select>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleTransfer} disabled={actionLoading || !transferReason.trim()}
                            style={{ height: 40, padding: '0 18px', background: actionLoading ? S2 : A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                            Передать менеджеру
                          </button>
                          <button onClick={() => setShowTransfer(false)}
                            style={{ height: 40, padding: '0 18px', background: S, color: M, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Отмена
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isDone && (
                <div style={{ padding: 16, background: S2, borderRadius: 10, fontSize: 14, color: M, textAlign: 'center' }}>
                  Обращение завершено
                </div>
              )}

              {!isAssigned && !isWaiting && !isDone && (
                <div style={{ padding: 16, background: S2, borderRadius: 10, fontSize: 14, color: M }}>
                  Это обращение уже взял другой специалист: {r.specialist_name || '—'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderItem = (r, onClick, index) => (
    <HoverItem key={r.id} index={index} glow onClick={onClick}
      style={{ background: S, border: `1px solid ${BD}`, borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'all .2s', marginBottom: 8 }}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
          <div style={{ fontSize: 13, color: M }}>{r.client_name || r.client_email || '—'}{r.client_inn ? ` • ИНН ${r.client_inn}` : ''}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6, background: S2, color: STATUS_COLORS[r.status] || M, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {STATUS_LABELS[r.status] || r.status}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: L }}>
        {r.software_product && <span>{r.software_product}</span>}
        {r.product_version && <span>v{r.product_version}</span>}
        {r.config_type && <span>{r.config_type}</span>}
        <span>{formatDate(r.created_at)}</span>
      </div>
    </HoverItem>
  )

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: A, marginBottom: 6 }}>РАБОЧЕЕ МЕСТО L1</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: INK }}>Специалист поддержки</h1>
        </div>
        <button onClick={loadAll} style={{ background: S, color: INK, border: `1px solid ${BD}`, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
          Обновить
        </button>
      </div>

      <AnimatedTabs
        tabs={[{ id: 'queue', label: 'Общая очередь' }, { id: 'my', label: `Мои обращения${myRequests.length > 0 ? ` (${myRequests.length})` : ''}` }]}
        active={tab}
        onChange={setTab}
        className="mb-5"
        ariaLabel="Раздел L1"
      />

      {tab === 'queue' && (
        <div>
          <AnimatedTabs tabs={FILTERS} active={filter} onChange={setFilter} className="mb-4 max-w-full overflow-x-auto" ariaLabel="Фильтр очереди L1" />

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Поиск по клиенту, ИНН, заголовку…"
              style={{ flex: 1, maxWidth: 400, height: 38, border: `1px solid ${BD}`, borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = A}
              onBlur={e => e.target.style.borderColor = BD} />
            <button onClick={handleSearch} style={{ height: 38, padding: '0 14px', background: S, color: INK, border: `1px solid ${BD}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Search size={15} /> Найти
            </button>
          </div>

          {queue.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <ClipboardList size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Нет обращений в этой категории</div>
            </div>
          ) : (
            <HoverGroup layoutId="l1-queue-hover">
              {queue.map((r, index) => renderItem(r, () => openRequest(r.id), index))}
            </HoverGroup>
          )}
        </div>
      )}

      {tab === 'my' && (
        <div>
          {myRequests.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: M, fontSize: 14, background: S, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <UserCheck size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Нет обращений, назначенных на вас</div>
            </div>
          ) : (
            <HoverGroup layoutId="l1-my-hover">
              {myRequests.map((r, index) => renderItem(r, () => openRequest(r.id), index))}
            </HoverGroup>
          )}
        </div>
      )}
    </div>
  )
}
