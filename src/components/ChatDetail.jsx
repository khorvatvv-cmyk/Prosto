import { useState, useEffect } from 'react'
import { ArrowLeft, Phone, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { requestsApi } from '../api.js'

export default function ChatDetail({ request, onBack, onOpenManager, onEvaluate, onNavigate, showToast }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const ACCENT = 'var(--color-accent)'
  const INK = 'var(--color-ink)'
  const INK_MUTED = 'var(--color-ink-muted)'
  const INK_LIGHT = 'var(--color-ink-light)'
  const SURFACE = 'var(--color-surface)'
  const SURFACE_2 = 'var(--color-surface-2)'
  const BORDER = 'var(--color-border)'

  // Загрузка сообщений
  async function loadMessages() {
    try {
      const data = await requestsApi.get(request.id)
      setMessages(data.messages || [])
      if (data.messages?.some(m => m.sender === 'assistant') || data.request?.status !== 'open' || data.request?.level !== 'l0') {
        setPolling(false)
      }
    } catch (e) {
      console.error('Load messages error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setPolling(true)
    loadMessages()
  }, [request.id])

  // Polling для L0 ответа
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [polling, request.id])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setSending(true)
    setInput('')
    try {
      const data = await requestsApi.sendMessage(request.id, text)
      if (data.message) {
        setMessages(prev => [...prev, { sender: 'user', text }, data.message])
      } else {
        setMessages(prev => [...prev, { sender: 'user', text }])
      }
    } catch (e) {
      showToast('Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  const handleEvaluate = async (helped) => {
    await onEvaluate(request.id, helped)
    if (helped) {
      setMessages(prev => [...prev, { sender: 'system', text: 'Вопрос решён' }])
    } else {
      setMessages(prev => [...prev, { sender: 'system', text: 'Подключаем специалиста. Повторно описывать не нужно.' }])
    }
  }

  const isL0 = request.level === 'l0' && request.status !== 'done'
  const isDone = request.status === 'done'
  const hasAssistantReply = messages.some(m => m.sender === 'assistant')

  const badgeClass = isDone ? 'badge-done' : isL0 ? 'badge-new' : 'badge-waiting'
  const badgeText = isDone ? 'Решено' : isL0 ? 'Ищем решение' : 'Специалист'

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium border-none bg-transparent cursor-pointer mb-4 px-3 py-1.5"
        style={{ color: INK_MUTED, borderRadius: 6, transition: 'all .2s', fontFamily: 'inherit' }}
        onMouseEnter={e=>{e.currentTarget.style.color=INK;e.currentTarget.style.background=SURFACE_2}}
        onMouseLeave={e=>{e.currentTarget.style.color=INK_MUTED;e.currentTarget.style.background='transparent'}}>
        <ArrowLeft size={16} /> Назад к вопросам
      </button>

      <div className="flex border overflow-hidden" style={{ borderColor: BORDER, borderRadius: 14, height: 'calc(100vh - 56px - 32px - 32px - 48px)', background: SURFACE, boxShadow: '0 2px 4px rgba(0,0,0,.05)' }}>
        {/* META */}
        <div className="hidden md:flex flex-col p-6 overflow-y-auto" style={{ width: 260, borderRight: `1px solid ${BORDER}`, background: SURFACE }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>Статус</div>
            <span className={`badge ${badgeClass}`} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 6 }}>{badgeText}</span>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>Канал</div>
            <div style={{ fontSize: 14 }}>{isL0 ? 'Ассистент ПРОСТО' : 'Специалист'}</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>Вопрос</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{request.title}</div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
            <button onClick={onOpenManager} className="w-full text-left px-3 py-2 border-none bg-transparent cursor-pointer"
              style={{ color: INK_MUTED, fontSize: 14, borderRadius: 6, fontFamily: 'inherit', transition: 'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background=SURFACE_2;e.currentTarget.style.color=INK}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=INK_MUTED}}>
              <Phone size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Связаться с менеджером
            </button>
          </div>
        </div>

        {/* CHAT */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>{request.title}</h3>
            <div style={{ fontSize: 11, fontWeight: 600, color: INK_LIGHT, textTransform: 'uppercase' }}>{isL0 ? 'Ассистент' : 'Специалист'}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3" style={{ background: 'var(--color-bg)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 20, color: INK_MUTED, fontSize: 14 }}>
                <span className="animate-blink" style={{ display: 'inline-block', width: 7, height: 7, background: ACCENT, borderRadius: '50%', marginRight: 3 }}></span>
                <span className="animate-blink" style={{ display: 'inline-block', width: 7, height: 7, background: ACCENT, borderRadius: '50%', marginRight: 3, animationDelay: '.2s' }}></span>
                <span className="animate-blink" style={{ display: 'inline-block', width: 7, height: 7, background: ACCENT, borderRadius: '50%', animationDelay: '.4s' }}></span>
              </div>
            ) : (
              <>
                {/* User's initial message */}
                {request.description && (
                  <div className="animate-fade-up" style={{ maxWidth: 480, padding: '14px 18px', border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE_2, alignSelf: 'flex-end', fontSize: 14, lineHeight: 1.6, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: INK_LIGHT, marginBottom: 6, textAlign: 'right' }}>Вы</div>
                    {request.description}
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => (
                  <div key={i} className="animate-fade-up" style={{
                    maxWidth: 480, padding: '14px 18px', border: `1px solid ${msg.sender==='system'?SURFACE_2:BORDER}`,
                    borderRadius: 10, fontSize: 14, lineHeight: 1.6, boxShadow: '0 1px 2px rgba(0,0,0,.03)',
                    background: msg.sender === 'user' ? SURFACE_2 : msg.sender === 'system' ? SURFACE_2 : SURFACE,
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    textAlign: msg.sender === 'system' ? 'center' : 'left',
                    color: msg.sender === 'system' ? INK_MUTED : INK,
                  }}>
                    {msg.sender === 'assistant' && <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: ACCENT, marginBottom: 6 }}>Ассистент ПРОСТО</div>}
                    {msg.sender === 'user' && <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: INK_LIGHT, marginBottom: 6, textAlign: 'right' }}>Вы</div>}
                    {msg.text}
                  </div>
                ))}

                {/* L0 loading — waiting for assistant */}
                {isL0 && !hasAssistantReply && !loading && (
                  <div style={{ textAlign: 'center', padding: 20, color: INK_MUTED, fontSize: 14 }}>
                    <span className="animate-blink" style={{ display: 'inline-block', width: 7, height: 7, background: ACCENT, borderRadius: '50%', marginRight: 3 }}></span>
                    <span className="animate-blink" style={{ display: 'inline-block', width: 7, height: 7, background: ACCENT, borderRadius: '50%', marginRight: 3, animationDelay: '.2s' }}></span>
                    <span className="animate-blink" style={{ display: 'inline-block', width: 7, height: 7, background: ACCENT, borderRadius: '50%', animationDelay: '.4s' }}></span>
                    <div style={{ marginTop: 8 }}>Ассистент ПРОСТО ищет решение…</div>
                  </div>
                )}

                {/* Evaluation buttons */}
                {isL0 && hasAssistantReply && !isDone && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: INK_MUTED, marginBottom: 10 }}>Помогло решение?</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => handleEvaluate(true)} className="inline-flex items-center gap-2 px-5 py-2.5 border cursor-pointer"
                        style={{ borderColor: 'var(--color-border-strong)', background: SURFACE, color: INK, fontSize: 14, fontWeight: 600, borderRadius: 6, fontFamily: 'inherit', transition: 'all .2s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=INK;e.currentTarget.style.color='#fff'}}
                        onMouseLeave={e=>{e.currentTarget.style.background=SURFACE;e.currentTarget.style.color=INK}}>
                        <CheckCircle2 size={16} /> Да, всё работает
                      </button>
                      <button onClick={() => handleEvaluate(false)} className="inline-flex items-center gap-2 px-5 py-2.5 border cursor-pointer"
                        style={{ borderColor: 'var(--color-border-strong)', background: SURFACE, color: INK, fontSize: 14, fontWeight: 600, borderRadius: 6, fontFamily: 'inherit', transition: 'all .2s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=ACCENT;e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor=ACCENT}}
                        onMouseLeave={e=>{e.currentTarget.style.background=SURFACE;e.currentTarget.style.color=INK;e.currentTarget.style.borderColor='var(--color-border-strong)'}}>
                        <AlertCircle size={16} /> Нет, нужна помощь
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* COMPOSER */}
          {!isDone && !isL0 && (
            <div className="flex items-center gap-2.5 p-4" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSend()}}
                placeholder="Напишите сообщение…"
                style={{ flex: 1, border: `1px solid ${BORDER}`, background: SURFACE_2, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: INK, padding: '11px 15px', borderRadius: 6, transition: 'all .2s' }}
                onFocus={e=>{e.target.style.borderColor=ACCENT;e.target.style.boxShadow='0 0 0 4px var(--color-accent-glow)'}}
                onBlur={e=>{e.target.style.borderColor=BORDER;e.target.style.boxShadow='none'}} />
              <button onClick={handleSend} disabled={!input.trim() || sending}
                style={{ width: 42, height: 42, background: input.trim() ? ACCENT : 'var(--color-surface-3)', border: 'none', cursor: input.trim()?'pointer':'not-allowed', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                <Send size={18} style={{ color: '#fff' }} />
              </button>
            </div>
          )}
          {isDone && (
            <div className="text-center p-4" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE, fontSize: 14, color: INK_MUTED }}>
              Вопрос решён. <a onClick={()=>onNavigate('new')} style={{ color: ACCENT, fontWeight: 600, cursor: 'pointer' }}>Задать новый?</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
