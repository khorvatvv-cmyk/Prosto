export default function Header({ onNavigate, onOpenManager, page, user }) {
  const ACCENT = 'var(--color-accent)'
  const INK = 'var(--color-ink)'
  const INK_MUTED = 'var(--color-ink-muted)'
  const SURFACE = 'var(--color-surface)'
  const SURFACE_2 = 'var(--color-surface-2)'
  const BORDER = 'var(--color-border)'

  const navItems = [
    { id: 'dashboard', label: 'Вопросы' },
    { id: 'new', label: 'Задать вопрос' },
    { id: 'important', label: 'Важное' },
    { id: 'notifs', label: 'Уведомления' },
  ]

  const initials = user?.name ? user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <header className="flex items-center px-5 flex-shrink-0 gap-4" style={{ height: 56, borderBottom: `1px solid ${BORDER}`, background: SURFACE, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
      <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.03em', color: INK }}>
          просто<span style={{ color: ACCENT }}>.</span>
        </span>
      </div>

      <nav className="flex gap-1 flex-1">
        {navItems.map(item => (
          <a key={item.id} onClick={() => onNavigate(item.id)}
            className="cursor-pointer transition-all"
            style={{
              fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 6,
              color: page === item.id ? INK : INK_MUTED,
              background: page === item.id ? SURFACE_2 : 'transparent',
              textDecoration: 'none', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (page !== item.id) { e.target.style.color = INK; e.target.style.background = SURFACE_2 } }}
            onMouseLeave={e => { if (page !== item.id) { e.target.style.color = INK_MUTED; e.target.style.background = 'transparent' } }}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2.5">
        <button onClick={onOpenManager} className="inline-flex items-center gap-2 px-3.5 py-1.5 border cursor-pointer"
          style={{ borderColor: BORDER, background: SURFACE, fontSize: 13, fontWeight: 500, color: INK, borderRadius: 6, fontFamily: 'inherit', transition: 'all .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.color=ACCENT}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=INK}}>
          <span className="animate-pulse-dot" style={{ width: 8, height: 8, background: ACCENT, borderRadius: '50%', flexShrink: 0 }}></span>
          <span className="hidden md:inline">Команда поддержки</span>
        </button>

        <span className="hidden md:inline" style={{ fontSize: 13, color: INK_MUTED, whiteSpace: 'nowrap' }}>
          {user?.name || user?.email}
        </span>

        <div onClick={() => onNavigate('profile')} className="cursor-pointer"
          style={{ width: 34, height: 34, background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, borderRadius: '50%', transition: 'all .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.background=ACCENT;e.currentTarget.style.transform='scale(1.05)'}}
          onMouseLeave={e=>{e.currentTarget.style.background=INK;e.currentTarget.style.transform='scale(1)'}}>
          {initials}
        </div>
      </div>
    </header>
  )
}
