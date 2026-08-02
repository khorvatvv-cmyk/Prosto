import { MessageCircle, Star, Bell, User, Phone, LogOut, Headphones, Briefcase, BarChart } from 'lucide-react'

export default function Sidebar({ onNavigate, onOpenManager, page, onLogout, user }) {
  const A = 'var(--color-accent)'
  const INK = 'var(--color-ink)'
  const INK_MUTED = 'var(--color-ink-muted)'
  const SURFACE = 'var(--color-surface)'
  const SURFACE_2 = 'var(--color-surface-2)'
  const BORDER = 'var(--color-border)'

  const items = [
    { id: 'dashboard', label: 'Мои вопросы', icon: MessageCircle, action: () => onNavigate('dashboard') },
    { id: 'important', label: 'Важное для вас', icon: Star, action: () => onNavigate('important') },
    { id: 'notifs', label: 'Уведомления', icon: Bell, action: () => onNavigate('notifs') },
    ...((user?.role === 'specialist' || user?.role === 'admin') ? [{ id: 'specialist', label: 'Рабочее место L1', icon: Headphones, action: () => onNavigate('specialist') }] : []),
    ...((user?.role === 'manager' || user?.role === 'rof' || user?.role === 'admin') ? [{ id: 'manager', label: 'АРМ Менеджера', icon: Briefcase, action: () => onNavigate('manager') }] : []),
    ...((user?.role === 'rof' || user?.role === 'admin') ? [{ id: 'rof', label: 'РОФ', icon: BarChart, action: () => onNavigate('rof') }] : []),
  ]

  const itemStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    fontSize: 14, fontWeight: active ? 600 : 500, cursor: 'pointer', border: 'none',
    background: active ? SURFACE_2 : 'transparent', color: active ? INK : INK_MUTED,
    borderRadius: 8, fontFamily: 'inherit', transition: 'all .15s', width: '100%',
    textAlign: 'left', position: 'relative',
  })

  return (
    <nav style={{ width: 228, borderRight: `1px solid ${BORDER}`, flexShrink: 0, flexDirection: 'column', background: SURFACE, overflowY: 'auto', padding: '12px 8px' }} className="hidden md:flex">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(item => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button key={item.id} onClick={item.action} style={itemStyle(active)}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = SURFACE_2; e.currentTarget.style.color = INK } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK_MUTED } }}>
              {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: A, borderRadius: 2 }} />}
              <Icon size={18} strokeWidth={1.5} />
              {item.label}
              {item.badge && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: A, background: 'var(--color-accent-tint)', padding: '2px 8px', borderRadius: 10, minWidth: 20, textAlign: 'center' }}>{item.badge}</span>}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--color-ink-faint)', padding: '12px 12px 6px' }}>ОРГАНИЗАЦИЯ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => onNavigate('profile')} style={itemStyle(page === 'profile')}
            onMouseEnter={e => { if (page !== 'profile') { e.currentTarget.style.background = SURFACE_2; e.currentTarget.style.color = INK } }}
            onMouseLeave={e => { if (page !== 'profile') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK_MUTED } }}>
            {page === 'profile' && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: A, borderRadius: 2 }} />}
            <User size={18} strokeWidth={1.5} />
            Профиль
          </button>
          <button onClick={onOpenManager} style={itemStyle(false)}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE_2; e.currentTarget.style.color = INK }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK_MUTED }}>
            <Phone size={18} strokeWidth={1.5} />
            Связаться с менеджером
          </button>
          <button onClick={onLogout} style={itemStyle(false)}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE_2; e.currentTarget.style.color = INK }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK_MUTED }}>
            <LogOut size={18} strokeWidth={1.5} />
            Выйти
          </button>
        </div>
      </div>
    </nav>
  )
}
