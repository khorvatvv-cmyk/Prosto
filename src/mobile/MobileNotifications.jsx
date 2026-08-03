import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bell, Bot, CheckCircle2, Megaphone, MessageCircle, UserRound } from 'lucide-react'
import { feedApi, notificationsApi } from '../api.js'
import { MobileEmpty, MobileError, MobileScreenSkeleton } from './MobilePrimitives.jsx'
import { formatMobileDate, friendlyError, statusMeta } from './mobile-utils.js'

export default function MobileNotifications({ requests, onBack, onOpenRequest, onNavigate, onRefresh }) {
  const [serverItems, setServerItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { const data = await notificationsApi.list(); setServerItems(data.items || []); onRefresh?.(data) }
    catch (loadError) { setError(friendlyError(loadError)) }
    finally { setLoading(false) }
  }, [onRefresh])
  useEffect(() => { load() }, [load])

  const items = useMemo(() => {
    const requestItems = requests.slice(0, 12).map(request => {
      const status = statusMeta(request)
      return { type: 'request', id: request.id, title: status.label, description: request.title, created_at: request.last_message_at || request.created_at, unread: request.unread_count > 0, icon: request.status === 'done' ? CheckCircle2 : request.level === 'l1' ? UserRound : Bot }
    })
    return [...serverItems, ...requestItems].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 30)
  }, [requests, serverItems])

  const open = async item => {
    if (item.type === 'manager_message') return onNavigate('manager-chat')
    if (item.type === 'campaign') { try { await feedApi.action(item.id, 'open') } catch { /* feed remains readable */ } return onNavigate('important') }
    onOpenRequest(item.id)
  }

  return (
    <section className="m-notifications" data-testid="mobile-notifications">
      <header className="m-focus-header"><button type="button" aria-label="Назад" onClick={onBack}><ArrowLeft size={23} /></button><span>Уведомления</span><i /></header>
      <div className="m-notification-body">
        <div className="m-screen-heading"><p>Ничего не пропустите</p><h1>Что нового</h1></div>
        {loading ? <MobileScreenSkeleton cards={4} /> : error ? <MobileError message={error} onRetry={load} /> : items.length ? <div className="m-notification-list">{items.map((item, index) => {
          const Icon = item.icon || (item.type === 'manager_message' ? MessageCircle : Megaphone)
          return <button key={`${item.type}-${item.id}-${index}`} type="button" className={item.unread ? 'is-unread' : ''} onClick={() => open(item)}><span><Icon size={19} /></span><div><strong>{item.title}</strong><p>{item.description}</p><time>{formatMobileDate(item.created_at)}</time></div>{item.unread && <i />}</button>
        })}</div> : <MobileEmpty icon={Bell} title="Уведомлений пока нет" text="Здесь появятся новые ответы, сообщения менеджера и важные обновления." />}
      </div>
    </section>
  )
}
