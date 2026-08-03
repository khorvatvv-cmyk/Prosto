import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, BellRing, Check, Megaphone, Newspaper, Sparkles, Tag, X } from 'lucide-react'
import { feedApi } from '../api.js'
import { MobileBadge, MobileButton, MobileEmpty, MobileError, MobileScreenSkeleton, MobileTabs } from './MobilePrimitives.jsx'
import { formatMobileDate, friendlyError } from './mobile-utils.js'

const FILTERS = [{ id: 'all', label: 'Все' }, { id: 'new', label: 'Новое' }, { id: 'promo', label: 'Акции' }, { id: 'updates', label: 'Обновления' }]
const CATEGORY = {
  promo: { label: 'Акция', icon: Tag },
  news: { label: 'Обновление', icon: Newspaper },
  event: { label: 'Событие', icon: BellRing },
  info: { label: 'Полезное', icon: Sparkles },
}
export default function MobileImportant({ onNavigate, showToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { const data = await feedApi.list(); setItems(data.items || []) }
    catch (loadError) { setError(friendlyError(loadError)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  const visible = useMemo(() => items.filter(item => {
    if (filter === 'new') return item.unread || !item.opened_at
    if (filter === 'promo') return item.category === 'promo'
    if (filter === 'updates') return ['news', 'event'].includes(item.category)
    return true
  }), [filter, items])

  const act = async (item, action) => {
    setBusy(`${action}-${item.id}`)
    try {
      await feedApi.action(item.id, action)
      if (action === 'hide') setItems(current => current.filter(candidate => candidate.id !== item.id))
      if (action === 'manager') onNavigate('manager-chat')
      if (action === 'open') setItems(current => current.map(candidate => candidate.id === item.id ? { ...candidate, unread: false, opened_at: new Date().toISOString() } : candidate))
    } catch (actionError) { showToast?.(friendlyError(actionError)) }
    finally { setBusy(null) }
  }

  return (
    <section className="m-screen" data-testid="mobile-important">
      <div className="m-screen-heading"><p>Только полезное</p><h1>Важное для вас</h1><span>Обновления, рекомендации и предложения от вашей команды.</span></div>
      <MobileTabs label="Категории" active={filter} onChange={setFilter} items={FILTERS} />
      {loading ? <MobileScreenSkeleton cards={3} /> : error ? <MobileError message={error} onRetry={load} /> : visible.length ? (
        <div className="m-feed-list">{visible.map(item => {
          const meta = CATEGORY[item.category] || CATEGORY.info
          const Icon = meta.icon
          return <article key={item.id} className={`m-feed-card ${item.unread || !item.opened_at ? 'is-new' : ''}`} onClick={() => act(item, 'open')}>
            <div className="m-feed-top"><span className="m-feed-icon"><Icon size={19} /></span><MobileBadge tone={item.category === 'promo' ? 'accent' : 'info'}>{meta.label}</MobileBadge>{(item.unread || !item.opened_at) && <i>Новое</i>}<time>{formatMobileDate(item.created_at, false)}</time></div>
            <h2>{item.title}</h2>{item.subject && <strong>{item.subject}</strong>}<p>{item.full_text || item.short_text}</p>
            <div className="m-feed-actions">{item.action_label && <MobileButton size="sm" onClick={event => { event.stopPropagation(); act(item, 'manager') }} disabled={Boolean(busy)}><ArrowRight size={16} /> {item.action_label}</MobileButton>}<button type="button" onClick={event => { event.stopPropagation(); act(item, 'hide') }} disabled={Boolean(busy)}><X size={16} /> Неактуально</button>{item.opened_at && <span><Check size={15} /> Просмотрено</span>}</div>
          </article>
        })}</div>
      ) : <MobileEmpty icon={Megaphone} title="Здесь пока тихо" text="Когда появится важное обновление, рекомендация или акция — вы увидите её здесь." />}
    </section>
  )
}
