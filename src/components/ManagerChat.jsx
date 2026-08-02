import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Send, Headphones } from 'lucide-react'
import { chatApi } from '../api.js'

export default function ManagerChat({ user, onClose, showToast }) {
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState(null)
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

  const A = '#E50071'
  const INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'
  const BG = '#FAFAFA'

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatApi.list()
      setConversations(data.conversations || [])
      if (data.org) setOrg(data.org)
    } catch (e) {
      console.error('Chat list error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (convId) => {
    try {
      const data = await chatApi.messages(convId)
      setMessages(data.messages || [])
      setActiveConv(data.conversation || null)
    } catch (e) {
      console.error('Chat messages error:', e)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const activeConvId = activeConv?.id

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId)
      pollingRef.current = setInterval(() => loadMessages(activeConvId), 5000)
      return () => clearInterval(pollingRef.current)
    }
  }, [activeConvId, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    try {
      const data = await chatApi.send(text, activeConv?.id)
      if (!activeConv && data.message?.conversation_id) {
        await loadConversations()
        const conv = conversations.find(c => c.id === data.message.conversation_id)
        if (conv) setActiveConv(conv)
      }
      setMessages(prev => [...prev, { sender_id: user.id, text, created_at: new Date().toISOString(), sender_name: user.name }])
      await loadConversations()
    } catch (e) {
      setInput(text)
      showToast?.(e.message || 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && !sending) onClose?.()
  }, [onClose, sending])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [handleKeyDown])

  const hasManager = Boolean(activeConv?.manager_id || org?.manager_id)

  return (
    <div
      role="presentation"
      onClick={(event) => { if (event.target === event.currentTarget && !sending) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,.38)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: 520, height: '80vh', maxHeight: 700, display: 'flex', flexDirection: 'column',
          backgroundColor: S, borderRadius: 18, position: 'relative', overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0,0,0,.22)', animation: 'fadeUp .25s ease both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Headphones size={20} color={A} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: INK }}>Ваш менеджер</h2>
              {loading ? (
                <div style={{ fontSize: 13, color: M, marginTop: 2 }}>Загрузка…</div>
              ) : hasManager ? (
                <div style={{ fontSize: 13, color: M, marginTop: 2 }}>{activeConv?.manager_name || 'Менеджер назначен'}</div>
              ) : (
                <div style={{ fontSize: 13, color: M, marginTop: 2 }}>Менеджер назначается. Вы можете написать сообщение.</div>
              )}
            </div>
          </div>
          <button type="button" aria-label="Закрыть" onClick={onClose} disabled={sending}
            style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', backgroundColor: S2, color: M, cursor: sending ? 'not-allowed' : 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, background: BG }}>
          {messages.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: M, fontSize: 14 }}>
              <Headphones size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div>Напишите вашему менеджеру — он ответит в ближайшее время</div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender_id === user.id
              return (
                <div key={i} style={{
                  maxWidth: 380, padding: '12px 16px',
                  borderRadius: 10, fontSize: 14, lineHeight: 1.5,
                  background: isMe ? A : S,
                  color: isMe ? '#fff' : INK,
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  border: isMe ? 'none' : `1px solid ${BD}`,
                }}>
                  {!isMe && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: M, marginBottom: 4 }}>
                      {msg.sender_name || 'Менеджер'}
                    </div>
                  )}
                  {msg.text}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: `1px solid ${BD}`, background: S, flexShrink: 0 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Напишите сообщение…"
            style={{ flex: 1, height: 42, border: `1px solid ${BD}`, background: S2, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: INK, padding: '0 14px', borderRadius: 8 }}
            onFocus={e => e.target.style.borderColor = A}
            onBlur={e => e.target.style.borderColor = BD} />
          <button onClick={handleSend} disabled={!input.trim() || sending}
            style={{ width: 42, height: 42, background: input.trim() ? A : S2, border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={18} style={{ color: input.trim() ? '#fff' : L }} />
          </button>
        </div>
      </div>
    </div>
  )
}
