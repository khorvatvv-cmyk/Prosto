import { useEffect, useMemo, useState } from 'react'
import { Bell, CircleHelp, Home, Star, User } from 'lucide-react'
import { MobileAvatar } from './MobilePrimitives.jsx'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Главная', icon: Home },
  { id: 'questions', label: 'Вопросы', icon: CircleHelp },
  { id: 'important', label: 'Важное', icon: Star },
  { id: 'profile', label: 'Профиль', icon: User },
]

export default function MobileShell({ page, user, notificationSummary, onNavigate, hideNavigation = false, children }) {
  const [online, setOnline] = useState(navigator.onLine)
  const activePage = useMemo(() => ['detail', 'new', 'notifs'].includes(page) ? 'questions' : page, [page])

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <div className={`m-app ${hideNavigation ? 'm-app--focus' : ''}`}>
      {!online && <div className="m-offline" role="status">Нет подключения к интернету</div>}
      <header className="m-global-header">
        <button type="button" className="m-brand" aria-label="На главную" onClick={() => onNavigate('dashboard')}>
          просто<span>.</span>
        </button>
        <div className="m-global-actions">
          <button type="button" className="m-icon-button" aria-label="Уведомления" onClick={() => onNavigate('notifs')}>
            <Bell size={21} />
            {notificationSummary?.total > 0 && <span className="m-notification-dot">{Math.min(notificationSummary.total, 9)}</span>}
          </button>
          <button type="button" className="m-avatar-button" aria-label="Открыть профиль" onClick={() => onNavigate('profile')}>
            <MobileAvatar name={user?.name || user?.email} size="sm" />
          </button>
        </div>
      </header>

      <main className="m-content">{children}</main>

      {!hideNavigation && (
        <nav className="m-bottom-nav" aria-label="Основная навигация">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = activePage === item.id
            const badge = item.id === 'important' ? notificationSummary?.campaigns : item.id === 'questions' ? notificationSummary?.messages : 0
            return (
              <button key={item.id} type="button" aria-current={active ? 'page' : undefined} onClick={() => onNavigate(item.id)}>
                <span className="m-bottom-nav-icon"><Icon size={22} strokeWidth={active ? 2.5 : 2} />{badge > 0 && <i>{Math.min(badge, 9)}</i>}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
