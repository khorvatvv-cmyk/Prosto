import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, FileText, Headphones, Paperclip, Send } from 'lucide-react'
import { chatApi } from '../api.js'
import { MobileAvatar, MobileError, MobileScreenSkeleton } from './MobilePrimitives.jsx'
import { formatMobileDate, friendlyError } from './mobile-utils.js'

export default function MobileManagerChat({ user, onBack, showToast }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(() => sessionStorage.getItem('prosto_manager_draft') || '')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  const loadMessages = useCallback(async id => {
    if (!id) return
    const data = await chatApi.messages(id)
    setMessages(data.messages || [])
  }, [])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await chatApi.list()
      const item = (data.conversations || [])[0] || null
      setConversation(item)
      if (item?.id) await loadMessages(item.id)
    } catch (loadError) { setError(friendlyError(loadError)) }
    finally { setLoading(false) }
  }, [loadMessages])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!conversation?.id) return undefined
    const timer = window.setInterval(() => loadMessages(conversation.id).catch(() => {}), 6000)
    return () => window.clearInterval(timer)
  }, [conversation?.id, loadMessages])
  useEffect(() => { sessionStorage.setItem('prosto_manager_draft', draft) }, [draft])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages])

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true); setDraft('')
    try {
      await chatApi.send(text, conversation?.id)
      sessionStorage.removeItem('prosto_manager_draft')
      await load()
    } catch (sendError) { setDraft(text); showToast?.(friendlyError(sendError)) }
    finally { setSending(false) }
  }

  if (loading) return <MobileScreenSkeleton cards={4} />
  if (error) return <MobileError message={error} onRetry={load} />
  const managerName = conversation?.manager_name || 'Команда сопровождения'
  const membershipPending = user?.membership_status !== 'active' && !conversation?.manager_name
  return (
    <section className="m-manager-chat" data-testid="mobile-manager-chat">
      <header className="m-manager-chat-header"><button type="button" aria-label="Назад" onClick={onBack}><ArrowLeft size={23} /></button><MobileAvatar name={managerName} /><span><strong>{managerName}</strong><small>{conversation?.manager_name ? 'Ваш менеджер · на связи' : 'Менеджер назначается'}</small></span></header>
      <div className="m-manager-message-list">
        {membershipPending ? <div className="m-manager-empty"><Headphones size={32} /><h2>Организация на проверке</h2><p>Как только администратор подтвердит организацию, здесь появится чат с вашим менеджером.</p></div> : !messages.length && <div className="m-manager-empty"><Headphones size={32} /><h2>Просто напишите менеджеру</h2><p>Обсудите документы, условия сопровождения или любой организационный вопрос.</p></div>}
        {messages.map((message, index) => {
          const mine = message.sender_id === user.id || message.role === 'user'
          return <article key={message.id || index} className={mine ? 'is-mine' : ''}>{!mine && <MobileAvatar name={message.sender_name || managerName} size="xs" />}<div><span>{mine ? 'Вы' : message.sender_name || managerName}</span><p>{message.text}</p>{message.file_name && <a href={message.file_url}><FileText size={16} /> {message.file_name}</a>}<time>{formatMobileDate(message.created_at)}</time></div></article>
        })}
        <div ref={endRef} />
      </div>
      {!membershipPending && <footer className="m-composer"><button type="button" className="m-attach" aria-label="Прикрепить файл" onClick={() => showToast?.('Вложения пока не поддерживаются сервером')}><Paperclip size={21} /></button><textarea rows={1} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Сообщение менеджеру…" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } }} /><button type="button" className="m-send" aria-label="Отправить" disabled={!draft.trim() || sending} onClick={send}><Send size={20} /></button></footer>}
    </section>
  )
}
