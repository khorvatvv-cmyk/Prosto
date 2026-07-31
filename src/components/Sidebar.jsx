import {
  MessageCircle,
  Bot,
  Users,
  Star,
  Bell,
  User,
  Phone,
  LogOut,
} from 'lucide-react';

const ACCENT = 'var(--color-accent)';
const INK = 'var(--color-ink)';
const INK_MUTED = 'var(--color-ink-muted)';
const INK_LIGHT = 'var(--color-ink-light)';
const SURFACE = 'var(--color-surface)';
const SURFACE_2 = 'var(--color-surface-2)';
const BORDER = 'var(--color-border)';

const MAIN_ITEMS = [
  { key: 'dashboard', label: 'Мои вопросы', icon: MessageCircle },
  { key: 'l0', label: 'Автоматические ответы', icon: Bot },
  { key: 'l1', label: 'Специалисты', icon: Users },
  { key: 'important', label: 'Важное', icon: Star, badge: 2 },
  { key: 'notifs', label: 'Уведомления', icon: Bell, badge: 3 },
];

const ORG_ITEMS = [
  { key: 'profile', label: 'Профиль', icon: User },
  { key: 'manager', label: 'Связаться с менеджером', icon: Phone, action: 'manager' },
  { key: '', label: 'Выйти', icon: LogOut, action: 'exit' },
];

function NavButton({ item, page, onNavigate, onFiltered, onOpenManager }) {
  const active = page === item.key;
  const handleClick = () => {
    if (item.action === 'manager') {
      onOpenManager?.();
      return;
    }
    if (item.action === 'exit') {
      onNavigate('');
      return;
    }
    onNavigate(item.key);
    if (item.key === 'dashboard' || item.key === 'l0' || item.key === 'l1') {
      onFiltered?.(item.key === 'dashboard' ? 'all' : item.key);
    }
  };

  const Icon = item.icon;

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center gap-2.5 w-full h-9 pl-3 pr-2.5 rounded-lg text-[13px] font-medium transition-colors text-left"
      style={{
        background: active ? SURFACE_2 : 'transparent',
        color: active ? INK : INK_MUTED,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = INK;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = INK_MUTED;
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
          style={{
            width: 3,
            height: 18,
            background: ACCENT,
          }}
        />
      )}
      <Icon size={16} style={{ color: active ? ACCENT : INK_LIGHT, flexShrink: 0 }} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && (
        <span
          className="flex items-center justify-center text-[11px] font-semibold text-white rounded-full"
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            background: ACCENT,
          }}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({ onNavigate, onFiltered, onOpenManager, page }) {
  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-[228px] py-3 px-2"
      style={{
        background: SURFACE,
        borderRight: `1px solid ${BORDER}`,
      }}
    >
      <nav className="flex flex-col gap-0.5">
        {MAIN_ITEMS.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            page={page}
            onNavigate={onNavigate}
            onFiltered={onFiltered}
            onOpenManager={onOpenManager}
          />
        ))}
      </nav>

      <div className="mt-4">
        <div
          className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: INK_LIGHT }}
        >
          ОРГАНИЗАЦИЯ
        </div>
        <div className="flex flex-col gap-0.5">
          {ORG_ITEMS.map((item) => (
            <NavButton
              key={item.key || item.label}
              item={item}
              page={page}
              onNavigate={onNavigate}
              onFiltered={onFiltered}
              onOpenManager={onOpenManager}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}