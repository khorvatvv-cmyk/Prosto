import { useState, useEffect, useCallback, useRef } from 'react'
import { Headphones, Send } from 'lucide-react'
import { chatApi } from '../api.js'
import { AnimatedTooltip, PrimaryGlowButton, StatefulButton } from './ui/AceternityEffects.jsx'

const A = '#E50071'
const INK = '#18181B'
const M = '#6B6B70'
const L = '#A0A0A5'
const S = '#FFFFFF'
const S2 = '#F4F4F5'
const BD = '#E4E4E7'
const BG = '#FAFAFA'

export default function ClientManagerChat({ user, showToast }) {
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const pollRef = useRef(null)
  const messagesEndRef = useRef(null)

  const loadList = useCallback(async () => {
    try {
      const data = await chatApi.list()
      const convs = data.conversations || []
      if (convs.length > 0) {
        setConversation(convs[0])
      }
    } catch (e) {
      console.error('Chat list error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return
    setMsgLoading(true)
    try {
      const data = await chatApi.messages(convId)
      setMessages(data.messages || [])
    } catch (e) {
      console.error('Chat messages error:', e)
    } finally {
      setMsgLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (conversation?.id) {
      loadMessages(conversation.id)
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => {
        loadMessages(conversation.id)
      }, 5000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [conversation?.id, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (t, convId) => {
    try {
      const data = await chatApi.send(t, convId)
      if (!convId && data.message?.conversation_id) {
        setLoading(true)
        const listData = await chatApi.list()
        const convs = listData.conversations || []
        if (convs.length > 0) {
          setConversation(convs[0])
          await loadMessages(convs[0].id)
        }
        setLoading(false)
      } else if (convId) {
        await loadMessages(convId)
      }
      return true
    } catch (e) {
      showToast?.(e.message || 'Ошибка отправки')
      return false
    }
  }

  const handleSend = async () => {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    setText('')
    const ok = await sendMessage(t, conversation?.id)
    if (!ok) setText(t)
    setSending(false)
    return ok
  }

  const handleFirstSend = async () => {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    setText('')
    const ok = await sendMessage(t, null)
    if (!ok) setText(t)
    setSending(false)
    return ok
  }

  const handleKeyDown = (e, handler) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handler()
    }
  }

  const hasManager = Boolean(conversation?.manager_name)

  return (
    <div style={{ padding: '24px 16px 8px', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Headphones size={22} color={A} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-.03em', color: INK }}>Чат с менеджером</h1>
          {loading ? (
            <div style={{ fontSize: 13, color: M, marginTop: 2 }}>Загрузка…</div>
          ) : hasManager ? (
            <div style={{ fontSize: 13, color: M, marginTop: 2 }}>{conversation.manager_name}</div>
          ) : (
            <div style={{ fontSize: 13, color: M, marginTop: 2 }}>Менеджер назначается</div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: M }}>Загрузка…</div>
      ) : conversation ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: S, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, background: BG }}>
            {msgLoading ? (
              <div style={{ textAlign: 'center', color: M, padding: 40 }}>Загрузка сообщений…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: M, padding: 40, fontSize: 14 }}>
                <Headphones size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div>Напишите вашему менеджеру — он ответит в ближайшее время</div>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id || msg.role === 'user'
                return (
                  <div key={msg.id || i} style={{
                    maxWidth: '70%', padding: '12px 16px',
                    borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                    background: isMe ? A : S2,
                    color: isMe ? '#fff' : INK,
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    {!isMe && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: M, marginBottom: 4 }}>
                        {msg.sender_name || 'Менеджер'}
                      </div>
                    )}
                    <div>{msg.text}</div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: `1px solid ${BD}`, background: S }}>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => handleKeyDown(e, handleSend)}
              placeholder="Напишите сообщение…"
              style={{ flex: 1, height: 42, border: `1px solid ${BD}`, background: S2, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: INK, padding: '0 14px', borderRadius: 8, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = A}
              onBlur={e => e.target.style.borderColor = BD}
            />
            <AnimatedTooltip label="Отправить сообщение">
              <PrimaryGlowButton onClick={handleSend} disabled={!text.trim() || sending}
                style={{ width: 42, height: 42, background: text.trim() ? A : S2, border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={18} color={text.trim() ? '#fff' : L} />
              </PrimaryGlowButton>
            </AnimatedTooltip>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 460, width: '100%', padding: 32, background: S, border: `1px solid ${BD}`, borderRadius: 14, textAlign: 'center' }}>
            <Headphones size={40} color={A} style={{ marginBottom: 16 }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: INK }}>Написать сообщение</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: M, lineHeight: 1.55 }}>
              Напишите вашему менеджеру. Если менеджер ещё не назначен, он будет назначен автоматически.
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => handleKeyDown(e, handleFirstSend)}
              placeholder="Ваше сообщение…"
              rows={4}
              style={{ width: '100%', boxSizing: 'border-box', padding: 12, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: INK, lineHeight: 1.55, marginBottom: 14 }}
              onFocus={e => e.target.style.borderColor = A}
              onBlur={e => e.target.style.borderColor = BD}
            />
            <StatefulButton onAction={handleFirstSend} disabled={!text.trim() || sending} loadingText="Отправляем…" successText="Отправлено"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 24px', background: text.trim() ? A : S2, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              <Send size={16} /> Отправить
            </StatefulButton>
          </div>
        </div>
      )}
    </div>
  )
}
