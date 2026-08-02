import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Phone, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { requestsApi } from '../api.js'
import { AnimatedTooltip, CompactTimeline, EventBorder, GlowingCard, PrimaryGlowButton, StatefulButton } from './ui/AceternityEffects.jsx'

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
  'done': 'Решено',
}

export default function ChatDetail({ request, onBack, onOpenManager, onEvaluate, onNavigate, showToast }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [requestState, setRequestState] = useState(request)
  const [waitingAssistant, setWaitingAssistant] = useState(false)
  const assistantRequested = useRef(false)
  const showToastRef = useRef(showToast)
  showToastRef.current = showToast
  const prevMsgCount = useRef(0)
  const prevStatus = useRef('')
  const prevAssignedTo = useRef(null)
  const activeRequest = requestState || request

  const A = '#E50071'
  const INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'
  const BG = '#FAFAFA'

  const loadMessages = useCallback(async () => {
    try {
      const data = await requestsApi.get(request.id)
      const newMessages = data.messages || []
      const newRequest = data.request
      const newMsgCount = newMessages.length
      const newStatus = newRequest?.status || ''
      const newAssignedTo = newRequest?.assigned_to || null

      if (prevMsgCount.current > 0 && newMsgCount > prevMsgCount.current) {
        const lastMsg = newMessages[newMessages.length - 1]
        if (lastMsg.sender === 'specialist' && !lastMsg.is_internal) {
          showToastRef.current(`Специалист: ${lastMsg.text.slice(0, 60)}${lastMsg.text.length > 60 ? '…' : ''}`)
        } else if (lastMsg.sender === 'system') {
          if (lastMsg.text.includes('принял обращение')) {
            showToastRef.current('Специалист принял обращение в работу')
          } else if (lastMsg.text.includes('Назначен специалист')) {
            showToastRef.current('Специалист назначен на обращение')
          } else if (lastMsg.text.includes('Ожидается подтверждение')) {
            showToastRef.current('Специалист передал результат. Проверьте решение.')
          } else if (lastMsg.text.includes('вернулось в работу')) {
            showToastRef.current('Обращение вернулось в работу')
          } else if (lastMsg.text.includes('дополнительные данные')) {
            showToastRef.current('Специалист запросил дополнительные данные')
          }
        }
      }

      if (prevStatus.current && prevStatus.current !== newStatus) {
        if (newStatus === 'in_progress' && prevStatus.current === 'waiting') {
          showToastRef.current('Специалист подключился')
        } else if (newStatus === 'need_data') {
          showToastRef.current('Нужны дополнительные данные')
        } else if (newStatus === 'result_ready') {
          showToastRef.current('Результат готов — проверьте решение')
        } else if (newStatus === 'returned') {
          showToastRef.current('Обращение возвращено в работу')
        } else if (newStatus === 'done') {
          showToastRef.current('Вопрос решён')
        }
      }

      prevMsgCount.current = newMsgCount
      prevStatus.current = newStatus
      prevAssignedTo.current = newAssignedTo

      setMessages(newMessages)
      setRequestState(newRequest)

      const hasAnswer = newMessages.some(m => m.sender === 'assistant')
      const isL0Open = newRequest?.status === 'open' && newRequest?.level === 'l0'
      const isL1Active = newRequest?.level === 'l1' && newRequest?.status !== 'done'
      const isDone = newRequest?.status === 'done'

      if (isL0Open && !hasAnswer && !assistantRequested.current) {
        assistantRequested.current = true
        setWaitingAssistant(true)
        try {
          const answer = await requestsApi.requestAssistant(request.id)
          if (answer.message) {
            setMessages(prev => [...prev, answer.message])
          }
          if (answer.request) setRequestState(answer.request)
        } catch (error) {
          console.error('Assistant request error:', error)
          showToastRef.current('Ассистент не ответил. Можно повторить запрос или подключить специалиста.')
        } finally {
          setWaitingAssistant(false)
        }
      }

      if (isDone) {
        setPolling(false)
      } else if (isL0Open && hasAnswer && !waitingAssistant) {
        setPolling(false)
      } else if (isL1Active) {
        setPolling(true)
      }
    } catch (e) {
      console.error('Load messages error:', e)
    } finally {
      setLoading(false)
    }
  }, [request.id, waitingAssistant])

  useEffect(() => {
    setLoading(true)
    setPolling(true)
    setMessages([])
    setRequestState(request)
    setWaitingAssistant(false)
    assistantRequested.current = false
    prevMsgCount.current = 0
    prevStatus.current = ''
    prevAssignedTo.current = null
    loadMessages()
  }, [request, loadMessages])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [polling, loadMessages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending || waitingAssistant) return
    setSending(true)
    setInput('')
    setWaitingAssistant(true)
    try {
      const data = await requestsApi.sendMessage(activeRequest.id, text)
      if (data.message) {
        setMessages(prev => [...prev, { sender: 'user', text }, data.message])
      } else {
        setMessages(prev => [...prev, { sender: 'user', text }])
      }
    } catch (e) {
      setInput(text)
      showToast(`Ошибка отправки: ${e.message}`)
    } finally {
      setSending(false)
      setWaitingAssistant(false)
      if (activeRequest.level === 'l1') setPolling(true)
    }
  }

  const retryAssistant = () => {
    assistantRequested.current = false
    setPolling(true)
    loadMessages()
    return true
  }

  const handleEvaluate = async (helped) => {
    await onEvaluate(activeRequest.id, helped)
    if (helped) {
      setMessages(prev => [...prev, { sender: 'system', text: 'Вопрос решён' }])
    } else if (activeRequest.level === 'l0') {
      setMessages(prev => [...prev, { sender: 'system', text: 'Подключаем специалиста. Повторно описывать не нужно.' }])
    } else {
      setMessages(prev => [...prev, { sender: 'system', text: 'Обращение возвращено в работу.' }])
    }
    setPolling(true)
    loadMessages()
  }

  const isL0 = activeRequest.level === 'l0' && activeRequest.status !== 'done'
  const isL1 = activeRequest.level === 'l1' && activeRequest.status !== 'done'
  const isDone = activeRequest.status === 'done'
  const assistantMessages = messages.filter(m => m.sender === 'assistant')
  const hasAssistantReply = assistantMessages.length > 0
  const isResultReady = activeRequest.status === 'result_ready'
  const showL1Buttons = isL0 && hasAssistantReply && !isDone
  const showL1Confirm = isResultReady && !isDone
  const showComposer = !isDone && !waitingAssistant && ((isL0 && hasAssistantReply) || (isL1 && !isResultReady))

  const badgeText = isDone ? 'Решено' : isL0 ? 'Ищем решение' : (STATUS_LABELS[activeRequest.status] || 'В работе')
  const badgeColor = isDone ? M : isL0 ? A : (['waiting', 'need_data', 'returned'].includes(activeRequest.status) ? A : INK)
  const badgeBg = isDone ? S2 : isL0 ? '#FFF0F7' : S2

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <button onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: M, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', marginBottom: 16, padding: '6px 12px 6px 8px', borderRadius: 6, transition: 'all .2s' }}
        onMouseEnter={e=>{e.currentTarget.style.color=INK;e.currentTarget.style.background=S2}}
        onMouseLeave={e=>{e.currentTarget.style.color=M;e.currentTarget.style.background='transparent'}}>
        <ArrowLeft size={16} /> Назад к вопросам
      </button>

      <GlowingCard spotlight active style={{ display: 'flex', border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden', height: 'calc(100vh - 56px - 32px - 32px - 52px)', background: S, boxShadow: '0 2px 4px rgba(0,0,0,.05)' }} contentStyle={{ display: 'flex', width: '100%', height: '100%' }} className="chat-layout">
        {/* META */}
        <div className="chat-meta" style={{ width: 260, borderRight: `1px solid ${BD}`, padding: 22, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: S, flexShrink: 0 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>Статус</div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6, background: badgeBg, color: badgeColor, border: `1px solid ${badgeBg}` }}>{badgeText}</span>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>Канал</div>
            <div style={{ fontSize: 14, color: INK }}>{isL0 ? 'Ассистент ПРОСТО' : 'Специалист'}</div>
            {isL1 && activeRequest.specialist_name && (
              <div style={{ fontSize: 13, color: INK, fontWeight: 500, marginTop: 2 }}>{activeRequest.specialist_name}</div>
            )}
            {isL1 && !activeRequest.specialist_name && activeRequest.status === 'waiting' && (
              <div style={{ fontSize: 12, color: M, marginTop: 2 }}>Ожидаем подключения…</div>
            )}
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>Вопрос</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.4 }}>{activeRequest.title}</div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: `1px solid ${BD}` }}>
            <button onClick={onOpenManager}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: M, fontSize: 14, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background=S2;e.currentTarget.style.color=INK}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=M}}>
              <Phone size={16} /> Связаться с менеджером
            </button>
          </div>
        </div>

        {/* CHAT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '14px 22px 12px', borderBottom: `1px solid ${BD}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: INK, margin: 0 }}>{activeRequest.title}</h3>
              <div style={{ fontSize: 11, fontWeight: 600, color: L, textTransform: 'uppercase' }}>{isL0 ? 'Ассистент' : (activeRequest.specialist_name || 'Специалист')}</div>
            </div>
            <CompactTimeline request={activeRequest} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 12, background: BG }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 20, color: M, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, background: A, borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></span>
                <span style={{ display: 'inline-block', width: 7, height: 7, background: A, borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '.2s' }}></span>
                <span style={{ display: 'inline-block', width: 7, height: 7, background: A, borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '.4s' }}></span>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <EventBorder key={i} active={i === messages.length - 1 && msg.sender !== 'user'} style={{ maxWidth: 480, alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', borderRadius: 10 }}>
                  <GlowingCard spotlight={msg.sender === 'assistant' || msg.sender === 'specialist'} style={{
                    padding: '14px 18px',
                    border: `1px solid ${msg.sender === 'system' ? S2 : BD}`,
                    borderRadius: 10, fontSize: 14, lineHeight: 1.6,
                    background: msg.sender === 'user' ? S2 : msg.sender === 'system' ? S2 : S,
                    textAlign: msg.sender === 'system' ? 'center' : 'left',
                    color: msg.sender === 'system' ? M : INK,
                    animation: 'fadeUp .3s ease both',
                  }}>
                    {msg.sender === 'assistant' && (
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: A, marginBottom: 6 }}>
                        Ассистент ПРОСТО
                      </div>
                    )}
                    {msg.sender === 'specialist' && (
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#16A34A', marginBottom: 6 }}>
                        {activeRequest.specialist_name || 'Специалист'}
                      </div>
                    )}
                    {msg.sender === 'user' && (
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: L, marginBottom: 6, textAlign: 'right' }}>
                        Вы
                      </div>
                    )}
                    {msg.sender === 'assistant' ? formatMessageText(msg.text) : msg.text}
                  </GlowingCard>
                  </EventBorder>
                ))}

                {waitingAssistant && !loading && (
                  <div style={{ textAlign: 'center', padding: 20, color: M, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{ display: 'inline-block', width: 7, height: 7, background: A, borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></span>
                      <span style={{ display: 'inline-block', width: 7, height: 7, background: A, borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '.2s' }}></span>
                      <span style={{ display: 'inline-block', width: 7, height: 7, background: A, borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '.4s' }}></span>
                    </div>
                    <div>Ассистент ПРОСТО анализирует задачу…</div>
                    <div style={{ fontSize: 12, color: L }}>Сложный вопрос может занять до минуты</div>
                  </div>
                )}

                {isL0 && !hasAssistantReply && !loading && !polling && !waitingAssistant && (
                  <div style={{ textAlign: 'center', padding: 20, color: M, fontSize: 14 }}>
                    <div style={{ marginBottom: 10 }}>Ассистент не успел подготовить ответ.</div>
                    <button onClick={retryAssistant}
                      style={{ border: `1px solid ${BD}`, background: S, color: INK, padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      Повторить запрос
                    </button>
                  </div>
                )}

                {/* L0 evaluation buttons */}
                {showL1Buttons && (
                  <div style={{ marginTop: 8, padding: '12px 16px', background: S2, borderRadius: 10, alignSelf: 'center', maxWidth: 420 }}>
                    <div style={{ fontSize: 13, color: M, marginBottom: 10, textAlign: 'center' }}>Помогло решение?</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <StatefulButton onAction={() => handleEvaluate(true)} loadingText="Подтверждаем…" successText="Решение подтверждено"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid #D4D4D8', background: S, color: INK, fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                        <CheckCircle2 size={16} /> Да, всё работает
                      </StatefulButton>
                      <button onClick={() => handleEvaluate(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid #D4D4D8', background: S, color: INK, fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor=A}}
                        onMouseLeave={e=>{e.currentTarget.style.background=S;e.currentTarget.style.color=INK;e.currentTarget.style.borderColor='#D4D4D8'}}>
                        <AlertCircle size={16} /> Подключить специалиста
                      </button>
                    </div>
                  </div>
                )}

                {/* L1 result confirmation */}
                {showL1Confirm && (
                  <div style={{ marginTop: 8, padding: '12px 16px', background: '#F0FDF4', borderRadius: 10, alignSelf: 'center', maxWidth: 420, border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: 13, color: M, marginBottom: 10, textAlign: 'center' }}>Специалист передал результат. Помогло?</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <StatefulButton onAction={() => handleEvaluate(true)} loadingText="Подтверждаем…" successText="Решение подтверждено"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid #D4D4D8', background: A, color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                        <CheckCircle2 size={16} /> Проблема решена
                      </StatefulButton>
                      <button onClick={() => handleEvaluate(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid #D4D4D8', background: S, color: INK, fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor=A}}
                        onMouseLeave={e=>{e.currentTarget.style.background=S;e.currentTarget.style.color=INK;e.currentTarget.style.borderColor='#D4D4D8'}}>
                        <AlertCircle size={16} /> Не помогло
                      </button>
                    </div>
                  </div>
                )}

                {isDone && (
                  <div style={{ textAlign: 'center', padding: '12px 20px', background: S2, borderRadius: 14, alignSelf: 'center', fontSize: 14, color: M, animation: 'fadeIn .4s ease' }}>
                    Вопрос решён
                  </div>
                )}
              </>
            )}
          </div>

          {/* COMPOSER */}
          {showComposer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderTop: `1px solid ${BD}`, background: S }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={isL1 ? 'Напишите сообщение специалисту…' : 'Уточните вопрос или задайте новый…'}
                style={{ flex: 1, border: `1px solid ${BD}`, background: S2, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: INK, padding: '11px 15px', borderRadius: 8, transition: 'all .2s' }}
                onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
              <AnimatedTooltip label="Отправить сообщение">
                <PrimaryGlowButton onClick={handleSend} disabled={!input.trim() || sending}
                  style={{ width: 42, height: 42, background: input.trim() ? A : S2, border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                  <Send size={18} style={{ color: input.trim() ? '#fff' : L }} />
                </PrimaryGlowButton>
              </AnimatedTooltip>
            </div>
          )}
          {isDone && (
            <div style={{ padding: '16px 22px', textAlign: 'center', fontSize: 14, color: M, borderTop: `1px solid ${BD}`, background: S }}>
              Вопрос решён. <span onClick={() => onNavigate('new')} style={{ color: A, fontWeight: 600, cursor: 'pointer' }}>Задать новый?</span>
            </div>
          )}
        </div>
      </GlowingCard>
    </div>
  )
}
