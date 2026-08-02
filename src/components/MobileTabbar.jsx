import { LayoutGrid, Plus, Star, Bell, User, ShieldCheck, Headphones, Briefcase, BarChart } from 'lucide-react';

const ACCENT = 'var(--color-accent)';
const INK_MUTED = 'var(--color-ink-muted)';
const SURFACE = 'var(--color-surface)';
const BORDER = 'var(--color-border)';

const TABS = [
  { key: 'dashboard', label: 'Вопросы', icon: LayoutGrid },
  { key: 'new', label: 'Задать', icon: Plus },
  { key: 'important', label: 'Важное', icon: Star },
  { key: 'notifs', label: 'Уведом.', icon: Bell },
  { key: 'profile', label: 'Профиль', icon: User },
];

function Tab({ tab, page, onNavigate }) {
  const active = page === tab.key;
  const Icon = tab.icon;

  return (
    <button
      onClick={() => onNavigate(tab.key)}
      className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer transition-colors"
      style={{ color: active ? ACCENT : INK_MUTED }}
    >
      <span className="relative">
        <Icon size={21} strokeWidth={active ? 2.4 : 2} />
        {tab.badge != null && (
          <span
            className="absolute -top-1.5 -right-2 flex items-center justify-center text-[9px] font-bold text-white rounded-full leading-none"
            style={{
              minWidth: 15,
              height: 15,
              padding: '0 4px',
              background: ACCENT,
            }}
          >
            {tab.badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium leading-none">{tab.label}</span>
    </button>
  );
}

export default function MobileTabbar({ onNavigate, page, user }) {
  const role = user?.role
  const extra = []
  if (role === 'specialist') extra.push({ key: 'specialist', label: 'L1', icon: Headphones })
  if (role === 'manager' || role === 'rof' || role === 'admin') extra.push({ key: 'manager', label: 'Клиенты', icon: Briefcase })
  if (role === 'rof' || role === 'admin') extra.push({ key: 'rof', label: 'РОФ', icon: BarChart })
  if (role === 'admin') extra.push({ key: 'admin', label: 'Админ', icon: ShieldCheck })
  const tabs = [...TABS, ...extra]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 flex items-stretch z-30"
      style={{
        height: 60,
        background: SURFACE,
        borderTop: `1px solid ${BORDER}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => (
        <Tab key={tab.key} tab={tab} page={page} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
