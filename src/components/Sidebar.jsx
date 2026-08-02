import { MessageCircle, Star, Bell, User, Phone, LogOut, Headphones, Briefcase, BarChart } from 'lucide-react'
import { HoverGroup, HoverItem } from './ui/AceternityEffects.jsx'

export default function Sidebar({ onNavigate, page, onLogout, user, notificationSummary = {} }) {
  const A = 'var(--color-accent)'
  const INK = 'var(--color-ink)'
  const INK_MUTED = 'var(--color-ink-muted)'
  const SURFACE = 'var(--color-surface)'
  const SURFACE_2 = 'var(--color-surface-2)'
  const BORDER = 'var(--color-border)'

  const clientItems = [
    { id: 'dashboard', label: 'Мои вопросы', icon: MessageCircle, action: () => onNavigate('dashboard') },
    { id: 'important', label: 'Важное для вас', icon: Star, badge: notificationSummary.campaigns || 0, action: () => onNavigate('important') },
    { id: 'notifs', label: 'Уведомления', icon: Bell, badge: notificationSummary.messages || 0, action: () => onNavigate('notifs') },
  ]
  const roleItems = {
    manager: [{ id: 'manager', label: 'АРМ менеджера', icon: Briefcase, action: () => onNavigate('manager') }],
    specialist: [{ id: 'specialist', label: 'АРМ специалиста', icon: Headphones, action: () => onNavigate('specialist') }],
    rof: [{ id: 'rof', label: 'АРМ РОФ', icon: BarChart, action: () => onNavigate('rof') }],
    admin: [
      ...clientItems,
      { id: 'specialist', label: 'Рабочее место L1', icon: Headphones, action: () => onNavigate('specialist') },
      { id: 'manager', label: 'АРМ менеджера', icon: Briefcase, action: () => onNavigate('manager') },
      { id: 'rof', label: 'АРМ РОФ', icon: BarChart, action: () => onNavigate('rof') },
    ],
  }
  const items = roleItems[user?.role] || clientItems

  const itemStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    fontSize: 14, fontWeight: active ? 600 : 500, cursor: 'pointer', border: 'none',
    background: active ? SURFACE_2 : 'transparent', color: active ? INK : INK_MUTED,
    borderRadius: 8, fontFamily: 'inherit', transition: 'all .15s', width: '100%',
    textAlign: 'left', position: 'relative',
  })

  return (
    <nav style={{ width: 228, borderRight: `1px solid ${BORDER}`, flexShrink: 0, flexDirection: 'column', background: SURFACE, overflowY: 'auto', padding: '12px 8px' }} className="hidden md:flex">
      <HoverGroup id="sidebar-main" gap={2}>
        {items.map((item, index) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <HoverItem key={item.id} index={index} active={active} style={{ borderRadius: 8 }}>
              <button onClick={item.action} style={itemStyle(active)}>
                {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: A, borderRadius: 2 }} />}
                <Icon size={18} strokeWidth={1.5} />
                {item.label}
                {item.badge && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: A, background: 'var(--color-accent-tint)', padding: '2px 8px', borderRadius: 10, minWidth: 20, textAlign: 'center' }}>{item.badge}</span>}
              </button>
            </HoverItem>
          )
        })}
      </HoverGroup>

      <div style={{ flex: 1 }} />

      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--color-ink-faint)', padding: '12px 12px 6px' }}>ОРГАНИЗАЦИЯ</div>
        <HoverGroup id="sidebar-footer" gap={2}>
          <HoverItem index={0} active={page === 'profile'} style={{ borderRadius: 8 }}>
            <button onClick={() => onNavigate('profile')} style={itemStyle(page === 'profile')}>
              {page === 'profile' && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: A, borderRadius: 2 }} />}
              <User size={18} strokeWidth={1.5} />
              Профиль
            </button>
          </HoverItem>
          {user?.role === 'user' && <HoverItem index={1} style={{ borderRadius: 8 }}>
            <button onClick={() => onNavigate('manager-chat')} style={itemStyle(false)}>
              <Phone size={18} strokeWidth={1.5} />
              Связаться с менеджером
            </button>
          </HoverItem>}
          <HoverItem index={2} style={{ borderRadius: 8 }}>
            <button onClick={onLogout} style={itemStyle(false)}>
              <LogOut size={18} strokeWidth={1.5} />
              Выйти
            </button>
          </HoverItem>
        </HoverGroup>
      </div>
    </nav>
  )
}
