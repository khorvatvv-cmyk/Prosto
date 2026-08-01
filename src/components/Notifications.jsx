import { Bell, Bot, UserCheck, CheckCircle2 } from 'lucide-react'

function notificationFor(request) {
  if (request.status === 'done') {
    return { icon: CheckCircle2, title: 'Вопрос решён', description: request.title }
  }
  if (request.level === 'l1' || request.status === 'waiting') {
    return { icon: UserCheck, title: 'Вопрос передан команде', description: request.title }
  }
  return { icon: Bot, title: 'Ассистент готовит ответ', description: request.title }
}

export default function Notifications({ requests, onOpenDetail }) {
  const recent = [...requests].slice(0, 10)

  return (
    <section style={{ padding: '24px 16px 8px' }}>
      <h1 style={{ margin: '0 0 20px', fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--color-ink)' }}>
        Уведомления
      </h1>

      {recent.length === 0 ? (
        <div style={{ maxWidth: 620, padding: '42px 24px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: 14, background: 'var(--color-surface)' }}>
          <Bell size={26} style={{ color: 'var(--color-ink-light)', marginBottom: 12 }} />
          <h2 style={{ margin: '0 0 6px', fontSize: 17 }}>Уведомлений пока нет</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-muted)' }}>Статусы ваших обращений появятся здесь.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
          {recent.map((request) => {
            const item = notificationFor(request)
            const Icon = item.icon
            return (
              <button key={request.id} type="button" onClick={() => onOpenDetail(request.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: 14, textAlign: 'left', border: '1px solid var(--color-border)', borderRadius: 10, background: 'var(--color-surface)', color: 'var(--color-ink)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: 'var(--color-accent-tint)', color: 'var(--color-accent)' }}>
                  <Icon size={18} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', marginBottom: 3, fontSize: 14, fontWeight: 650 }}>{item.title}</span>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--color-ink-muted)' }}>{item.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
