import { useMemo, useState } from 'react'
import { ChevronRight, CircleHelp, Plus, Search, UserRound } from 'lucide-react'
import { MobileAvatar, MobileBadge, MobileButton, MobileEmpty, MobileTabs } from './MobilePrimitives.jsx'
import { formatMobileDate, isOpenRequest, statusMeta } from './mobile-utils.js'

export function MobileRequestCard({ request, onOpen, featured = false }) {
  const status = statusMeta(request)
  return (
    <button type="button" className={`m-request-card ${featured ? 'm-request-card--featured' : ''}`} onClick={() => onOpen(request.id)}>
      <span className="m-request-card-top">
        <MobileBadge tone={status.tone}>{status.label}</MobileBadge>
        {request.unread_count > 0 && <span className="m-unread-label">Новый ответ</span>}
      </span>
      <strong>{request.title}</strong>
      {request.description && <span className="m-request-description">{request.description}</span>}
      <span className="m-request-meta">
        <span>{request.specialist_name ? <><MobileAvatar name={request.specialist_name} size="xs" /> {request.specialist_name}</> : <><UserRound size={15} /> {request.level === 'l1' ? 'Команда поддержки' : 'Просто'}</>}</span>
        <time>{formatMobileDate(request.last_message_at || request.created_at)}</time>
        <ChevronRight size={18} />
      </span>
    </button>
  )
}
export default function MobileRequests({ requests, onOpen, onNew }) {
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return requests.filter(request => (tab === 'active' ? isOpenRequest(request) : !isOpenRequest(request)))
      .filter(request => !term || `${request.title} ${request.description || ''}`.toLowerCase().includes(term))
  }, [requests, search, tab])

  return (
    <section className="m-screen" data-testid="mobile-requests">
      <div className="m-screen-heading m-screen-heading--actions">
        <div><p>Всё в одном месте</p><h1>Мои вопросы</h1></div>
        <MobileButton size="icon" aria-label="Задать новый вопрос" onClick={onNew}><Plus size={22} /></MobileButton>
      </div>

      <label className="m-search">
        <Search size={19} />
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Найти вопрос" />
      </label>

      <MobileTabs label="Фильтр вопросов" active={tab} onChange={setTab} items={[
        { id: 'active', label: `В работе · ${requests.filter(isOpenRequest).length}` },
        { id: 'done', label: `Решённые · ${requests.filter(request => !isOpenRequest(request)).length}` },
      ]} />

      {filtered.length ? (
        <div className="m-request-list">{filtered.map(request => <MobileRequestCard key={request.id} request={request} onOpen={onOpen} />)}</div>
      ) : (
        <MobileEmpty icon={CircleHelp} title={search ? 'Ничего не нашли' : tab === 'active' ? 'Нет вопросов в работе' : 'Решённых вопросов пока нет'}
          text={search ? 'Попробуйте изменить запрос.' : 'Просто расскажите, что случилось — мы поможем.'}
          action={!search && tab === 'active' ? <MobileButton onClick={onNew}><Plus size={18} /> Задать вопрос</MobileButton> : null} />
      )}
      <MobileButton className="m-sticky-action" onClick={onNew}><Plus size={19} /> Задать новый вопрос</MobileButton>
    </section>
  )
}
