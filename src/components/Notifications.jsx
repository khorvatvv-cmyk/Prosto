import { useCallback, useEffect, useState } from 'react'
import { Bell, Bot, UserCheck, CheckCircle2, MessageCircle, Megaphone } from 'lucide-react'
import { feedApi, notificationsApi } from '../api.js'

function requestNotification(request) {
  if (request.status === 'done') return { icon: CheckCircle2, title: 'Вопрос решён', description: request.title }
  if (request.level === 'l1' || request.status === 'waiting') return { icon: UserCheck, title: 'Вопрос передан команде', description: request.title }
  return { icon: Bot, title: 'Ассистент готовит ответ', description: request.title }
}

const formatDate = (value) => value
  ? new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  : ''

export default function Notifications({ requests = [], onOpenDetail, onNavigate, onRefresh }) {
  const [serverItems, setServerItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.list()
      setServerItems(data.items || [])
      onRefresh?.(data)
    } catch (error) {
      console.error('Notifications load error:', error)
    } finally {
      setLoading(false)
    }
  }, [onRefresh])

  useEffect(() => {
    load()
    const timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [load])

  const requestItems = requests.slice(0, 10).map(request => ({
    type: 'request',
    id: request.id,
    created_at: request.created_at,
    ...requestNotification(request),
  }))
  const items = [...serverItems, ...requestItems]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, 30)

  const openItem = async (item) => {
    if (item.type === 'manager_message') {
      onNavigate?.('manager-chat')
      setTimeout(() => onRefresh?.(), 700)
      return
    }
    if (item.type === 'campaign') {
      try { await feedApi.action(item.id, 'open') } catch (error) { console.error(error) }
      onNavigate?.('important')
      setTimeout(() => onRefresh?.(), 200)
      return
    }
    onOpenDetail?.(item.id)
  }

  return (
    <section style={{ padding: '24px 16px 8px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--color-ink)' }}>Уведомления</h1>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-ink-muted)' }}>Сообщения менеджера, новые акции и статусы обращений.</p>

      {loading ? (
        <div style={{ padding: 40, color: 'var(--color-ink-muted)' }}>Загрузка уведомлений…</div>
      ) : items.length === 0 ? (
        <div style={{ maxWidth: 620, padding: '42px 24px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: 14, background: 'var(--color-surface)' }}>
          <Bell size={26} style={{ color: 'var(--color-ink-light)', marginBottom: 12 }} />
          <h2 style={{ margin: '0 0 6px', fontSize: 17 }}>Уведомлений пока нет</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-muted)' }}>Здесь появятся сообщения менеджера, акции и изменения по обращениям.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 760 }}>
          {items.map(item => {
            const Icon = item.icon || (item.type === 'manager_message' ? MessageCircle : Megaphone)
            return (
              <button key={`${item.type}-${item.id}`} type="button" onClick={() => openItem(item)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: 14, textAlign: 'left', border: `1px solid ${item.unread ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 10, background: item.unread ? 'var(--color-accent-tint)' : 'var(--color-surface)', color: 'var(--color-ink)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: 'var(--color-surface)', color: 'var(--color-accent)' }}>
                  <Icon size={18} />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 650 }}>{item.title}</span>
                    {item.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />}
                  </span>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--color-ink-muted)' }}>{item.description}</span>
                  {item.created_at && <span style={{ display: 'block', marginTop: 5, fontSize: 11, color: 'var(--color-ink-light)' }}>{formatDate(item.created_at)}</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
