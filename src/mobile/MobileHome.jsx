import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, BellRing, ChevronRight, Headphones, MessageCirclePlus, Sparkles } from 'lucide-react'
import { chatApi, feedApi } from '../api.js'
import { MobileAvatar, MobileButton, MobileScreenSkeleton } from './MobilePrimitives.jsx'
import { MobileRequestCard } from './MobileRequests.jsx'
import { formatMobileDate, isOpenRequest } from './mobile-utils.js'

export default function MobileHome({ user, requests, loading, onNew, onOpen, onNavigate }) {
  const [extras, setExtras] = useState({ important: [], manager: null })
  const [extrasLoading, setExtrasLoading] = useState(true)
  const activeRequest = useMemo(() => requests.filter(isOpenRequest)
    .sort((a, b) => String(b.last_message_at || b.created_at).localeCompare(String(a.last_message_at || a.created_at)))[0], [requests])

  const loadExtras = useCallback(async () => {
    setExtrasLoading(true)
    const [feed, chats] = await Promise.allSettled([feedApi.list(), chatApi.list()])
    setExtras({
      important: feed.status === 'fulfilled' ? (feed.value.items || []).slice(0, 2) : [],
      manager: chats.status === 'fulfilled' ? (chats.value.conversations || [])[0] || null : null,
    })
    setExtrasLoading(false)
  }, [])

  useEffect(() => { loadExtras() }, [loadExtras])

  if (loading) return <MobileScreenSkeleton cards={4} />

  const firstName = user?.name?.trim().split(/\s+/)[0]
  const managerCaption = extras.manager?.manager_name
    ? 'Ваш менеджер · на связи'
    : user?.membership_status !== 'active'
      ? 'Организация проходит проверку'
      : 'Менеджер назначается'
  return (
    <section className="m-screen m-home" data-testid="mobile-home">
      <div className="m-greeting">
        <p>{firstName ? `Здравствуйте, ${firstName}` : 'Здравствуйте'}</p>
        <h1>Просто расскажите,<br />что случилось<span>.</span></h1>
      </div>

      <article className="m-ask-card">
        <span className="m-ask-card-icon"><Sparkles size={22} /></span>
        <div><h2>Что случилось?</h2><p>Опишите проблему своими словами — мы поможем.</p></div>
        <MobileButton onClick={onNew}><MessageCirclePlus size={19} /> Задать вопрос</MobileButton>
      </article>

      {activeRequest && (
        <section className="m-home-section">
          <div className="m-section-title"><div><span>Сейчас в работе</span><h2>Текущий вопрос</h2></div><button type="button" onClick={() => onNavigate('questions')}>Все <ChevronRight size={17} /></button></div>
          <MobileRequestCard request={activeRequest} onOpen={onOpen} featured />
        </section>
      )}

      <section className="m-home-section">
        <div className="m-section-title"><div><span>Полезно знать</span><h2>Важное</h2></div><button type="button" onClick={() => onNavigate('important')}>Все <ChevronRight size={17} /></button></div>
        {extrasLoading ? <div className="m-important-preview m-important-preview--loading" /> : extras.important.length ? (
          <div className="m-important-strip">{extras.important.map(item => (
            <button key={item.id} type="button" className="m-important-preview" onClick={() => onNavigate('important')}>
              <span><BellRing size={18} /></span><strong>{item.title}</strong><small>{item.short_text || item.subject || formatMobileDate(item.created_at)}</small><ArrowRight size={18} />
            </button>
          ))}</div>
        ) : <div className="m-quiet-card"><Sparkles size={20} /><div><strong>Пока всё спокойно</strong><span>Новые рекомендации и обновления появятся здесь.</span></div></div>}
      </section>

      <section className="m-home-section">
        <div className="m-section-title"><div><span>На связи</span><h2>Ваш менеджер</h2></div></div>
        <button type="button" className="m-manager-card" onClick={() => onNavigate('manager-chat')}>
          <MobileAvatar name={extras.manager?.manager_name || 'Команда сопровождения'} />
          <span><strong>{extras.manager?.manager_name || 'Команда сопровождения'}</strong><small>{managerCaption}</small></span>
          <span className="m-manager-card-action"><Headphones size={18} /> Написать</span>
        </button>
      </section>
    </section>
  )
}
