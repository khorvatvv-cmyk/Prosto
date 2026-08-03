import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronUp, CircleAlert, Info, Paperclip, RotateCcw, Send, Sparkles, UserRound } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { requestsApi } from '../api.js'
import { MobileAvatar, MobileBadge, MobileButton, MobileError, MobileScreenSkeleton, MobileSheet } from './MobilePrimitives.jsx'
import { formatMobileDate, friendlyError, statusMeta } from './mobile-utils.js'

const TIMELINE = ['Создано', 'Ассистент', 'Специалист', 'В работе', 'Решено']

function RequestDetails({ request }) {
  const status = statusMeta(request)
  const rows = [
    ['Создано', formatMobileDate(request.created_at, false)],
    ['Статус', status.label],
    ['Приоритет', request.priority === 'high' ? 'Высокий' : request.priority === 'low' ? 'Низкий' : 'Обычный'],
    ['Канал', request.level === 'l1' ? 'Специалист поддержки' : 'Ассистент «Просто»'],
    ['Специалист', request.specialist_name || 'Ещё не назначен'],
  ]
  return <div className="m-detail-list">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || '—'}</strong></div>)}</div>
}
function Timeline({ request }) {
  const current = statusMeta(request).step
  return <div className="m-timeline" aria-label={`Этап: ${TIMELINE[current]}`}>
    <div className="m-timeline-line"><i style={{ width: `${(current / 4) * 100}%` }} /></div>
    {TIMELINE.map((label, index) => <span key={label} className={index < current ? 'is-done' : index === current ? 'is-current' : ''}><i>{index < current ? <Check size={10} /> : null}</i><small>{label}</small></span>)}
  </div>
}

function Message({ message, request, user }) {
  const sender = message.sender
  if (sender === 'system') return <div className="m-system-message"><Info size={15} /><span>{message.text}</span></div>
  const mine = sender === 'user'
  const assistant = sender === 'assistant'
  const name = mine ? (user?.name || 'Вы') : assistant ? 'Просто' : `${request.specialist_name || 'Специалист'}, поддержка`
  return (
    <article className={`m-message ${mine ? 'm-message--mine' : ''}`}>
      {!mine && <MobileAvatar name={name} size="xs" />}
      <div className="m-message-wrap"><span className="m-message-name">{name}</span><div className="m-message-bubble"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text || ''}</ReactMarkdown></div>{message.created_at && <time>{formatMobileDate(message.created_at)}</time>}</div>
    </article>
  )
}

export default function MobileRequestChat({ requestId, request: initialRequest, user, onBack, onEvaluate, onRefreshRequests, showToast }) {
  const [request, setRequest] = useState(initialRequest)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(() => sessionStorage.getItem(`prosto_chat_draft_${requestId}`) || '')
  const [sending, setSending] = useState(false)
  const [assistantWaiting, setAssistantWaitingState] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [polling, setPolling] = useState(true)
  const assistantRequested = useRef(false)
  const waitingRef = useRef(false)
  const endRef = useRef(null)

  const setAssistantWaiting = useCallback(value => { waitingRef.current = value; setAssistantWaitingState(value) }, [])

  const load = useCallback(async () => {
    try {
      const data = await requestsApi.get(requestId)
      const nextRequest = data.request
      const nextMessages = data.messages || []
      setRequest(nextRequest)
      setMessages(nextMessages)
      setError('')
      const hasAssistant = nextMessages.some(message => message.sender === 'assistant')
      const needsInitialAnswer = nextRequest?.level === 'l0' && nextRequest?.status === 'open' && !hasAssistant
      if (needsInitialAnswer && !assistantRequested.current && !waitingRef.current) {
        assistantRequested.current = true
        setAssistantWaiting(true)
        try {
          const answer = await requestsApi.requestAssistant(requestId)
          if (answer.message) setMessages(current => [...current, answer.message])
          if (answer.request) setRequest(answer.request)
        } catch (assistantError) {
          setError(friendlyError(assistantError))
          setPolling(false)
        } finally {
          setAssistantWaiting(false)
        }
      }
      if (nextRequest?.status === 'done' || (nextRequest?.level === 'l0' && hasAssistant)) setPolling(false)
      else if (nextRequest?.level === 'l1') setPolling(true)
    } catch (loadError) {
      setError(friendlyError(loadError))
    } finally {
      setLoading(false)
    }
  }, [requestId, setAssistantWaiting])

  useEffect(() => {
    assistantRequested.current = false
    waitingRef.current = false
    setAssistantWaitingState(false)
    setLoading(true)
    setError('')
    setRequest(initialRequest)
    setMessages([])
    setPolling(true)
    load()
  }, [requestId, initialRequest, load])

  useEffect(() => {
    if (!polling) return undefined
    const timer = window.setInterval(load, 4000)
    return () => window.clearInterval(timer)
  }, [load, polling])

  useEffect(() => { sessionStorage.setItem(`prosto_chat_draft_${requestId}`, draft) }, [draft, requestId])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages, assistantWaiting])

  const send = async () => {
    const text = draft.trim()
    if (!text || sending || assistantWaiting) return
    setSending(true)
    setDraft('')
    setMessages(current => [...current, { id: `local-${Date.now()}`, sender: 'user', text }])
    try {
      const data = await requestsApi.sendMessage(requestId, text)
      if (data.message) setMessages(current => [...current, data.message])
      sessionStorage.removeItem(`prosto_chat_draft_${requestId}`)
      if (request?.level === 'l1') setPolling(true)
      await onRefreshRequests?.()
    } catch (sendError) {
      setDraft(text)
      showToast?.(friendlyError(sendError))
      await load()
    } finally {
      setSending(false)
    }
  }

  const evaluate = async helped => {
    await onEvaluate(requestId, helped)
    setPolling(true)
    await load()
  }

  const retry = () => {
    assistantRequested.current = false
    setError('')
    setPolling(true)
    load()
  }

  if (loading && !request) return <MobileScreenSkeleton cards={4} />
  if (!request) return <MobileError message={error} onRetry={load} />

  const status = statusMeta(request)
  const hasAssistant = messages.some(message => message.sender === 'assistant')
  const done = request.status === 'done'
  const resultReady = request.status === 'result_ready'
  const showL0Choice = request.level === 'l0' && hasAssistant && !done
  const showComposer = !done && !resultReady && !assistantWaiting && (request.level === 'l1' || hasAssistant)

  return (
    <section className="m-chat" data-testid="mobile-request-chat">
      <header className="m-chat-header">
        <button type="button" aria-label="Назад" onClick={onBack}><ArrowLeft size={23} /></button>
        <button type="button" className="m-chat-title" onClick={() => setDetailsOpen(true)}><strong>{request.title}</strong><span><MobileBadge tone={status.tone}>{status.label}</MobileBadge><ChevronUp size={14} /></span></button>
        <button type="button" aria-label="Детали обращения" onClick={() => setDetailsOpen(true)}><Info size={21} /></button>
      </header>
      <Timeline request={request} />

      <div className="m-message-list">
        {messages.map((message, index) => <Message key={message.id || `${message.sender}-${index}`} message={message} request={request} user={user} />)}
        {assistantWaiting && <div className="m-typing"><MobileAvatar name="Просто" size="xs" /><span><i /><i /><i /></span><small>Просто ищет решение. Это может занять до минуты.</small></div>}
        {error && !assistantWaiting && <div className="m-inline-error"><CircleAlert size={18} /><span>{error}</span><button type="button" onClick={retry}><RotateCcw size={16} /> Повторить</button></div>}

        {showL0Choice && <div className="m-resolution-card"><span className="m-resolution-icon"><Sparkles size={20} /></span><h2>Получилось решить вопрос?</h2><p>Если нет — специалист увидит всю переписку, повторять ничего не придётся.</p><MobileButton onClick={() => evaluate(true)}>Да, помогло</MobileButton><MobileButton variant="secondary" onClick={() => evaluate(false)}><UserRound size={18} /> Подключить специалиста</MobileButton></div>}
        {resultReady && <div className="m-resolution-card"><span className="m-resolution-icon"><Check size={20} /></span><h2>Вопрос решён?</h2><p>Проверьте результат специалиста.</p><MobileButton onClick={() => evaluate(true)}>Да, всё работает</MobileButton><MobileButton variant="secondary" onClick={() => evaluate(false)}>Нет, нужна помощь</MobileButton></div>}
        {done && <div className="m-resolved-note"><Check size={18} /> Вопрос решён. Переписка сохранена.</div>}
        <div ref={endRef} />
      </div>

      {showComposer && <footer className="m-composer"><button type="button" className="m-attach" aria-label="Прикрепить файл" onClick={() => showToast?.('Вложения пока не поддерживаются сервером')}><Paperclip size={21} /></button><textarea rows={1} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Напишите сообщение…" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } }} /><button type="button" className="m-send" aria-label="Отправить" disabled={!draft.trim() || sending} onClick={send}>{sending ? <i className="m-spinner" /> : <Send size={20} />}</button></footer>}

      <MobileSheet open={detailsOpen} title="Детали вопроса" onClose={() => setDetailsOpen(false)}><RequestDetails request={request} /></MobileSheet>
    </section>
  )
}
