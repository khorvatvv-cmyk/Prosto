import { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Bell,
  Star,
  Headset,
  ChevronDown,
} from 'lucide-react';

const ACCENT = 'var(--color-accent)';
const INK = 'var(--color-ink)';
const INK_MUTED = 'var(--color-ink-muted)';
const INK_LIGHT = 'var(--color-ink-light)';
const SURFACE = 'var(--color-surface)';
const SURFACE_2 = 'var(--color-surface-2)';
const BORDER = 'var(--color-border)';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Обращения', icon: LayoutGrid },
  { key: 'new', label: 'Создать', icon: Plus },
  { key: 'important', label: 'Важное для вас', icon: Star },
  { key: 'notifs', label: 'Уведомления', icon: Bell },
];

const ORG_NAME = 'ООО «Технополис»';

function Logo({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-[2px] shrink-0 cursor-pointer select-none"
      style={{ font: '600 18px/1 var(--font-sans)', color: INK }}
      title="На главную"
    >
      <span style={{ fontWeight: 500 }}>первый</span>
      <span
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          background: ACCENT,
          borderRadius: '50%',
          margin: '0 2px',
          transform: 'translateY(-1px)',
        }}
      />
      <span style={{ fontWeight: 700 }}>Бит</span>
    </button>
  );
}

function NavCenter({ page, onNavigate }) {
  return (
    <nav className="hidden md:flex items-center gap-1 mx-auto">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const active = page === key;
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors"
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
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function RightBlock({ onOpenManager, onNavigate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <button
        onClick={onOpenManager}
        className="hidden sm:flex items-center gap-2 h-9 pl-3 pr-3.5 rounded-lg text-[13px] font-medium transition-colors"
        style={{
          background: 'var(--color-accent-tint)',
          color: ACCENT,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(229,0,113,.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-accent-tint)';
        }}
      >
        <Headset size={15} />
        <span>Ваш менеджер</span>
        <span
          className="animate-pulse-dot"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: ACCENT,
          }}
        />
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-lg transition-colors"
          style={{ background: open ? SURFACE_2 : 'transparent' }}
          onMouseEnter={(e) => {
            if (!open) e.currentTarget.style.background = SURFACE_2;
          }}
          onMouseLeave={(e) => {
            if (!open) e.currentTarget.style.background = 'transparent';
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('profile');
            }}
            className="rounded-full flex items-center justify-center text-white text-[12px] font-semibold cursor-pointer"
            style={{
              width: 34,
              height: 34,
              background:
                'linear-gradient(135deg, var(--color-accent), var(--color-accent-press))',
            }}
          >
            ИВ
          </div>
          <span
            className="hidden lg:block max-w-[140px] truncate text-[13px] font-medium"
            style={{ color: INK }}
          >
            {ORG_NAME}
          </span>
          <ChevronDown
            size={14}
            style={{ color: INK_LIGHT }}
          />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute right-0 top-[44px] z-20 w-56 rounded-xl py-1.5 animate-scale-in"
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                boxShadow: '0 8px 24px rgba(0,0,0,.08)',
              }}
            >
              <div
                className="px-3 py-2 text-[12px]"
                style={{ color: INK_LIGHT }}
              >
                {ORG_NAME}
              </div>
              <button
                onClick={() => {
                  onNavigate('profile');
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[13px] transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: INK }}
              >
                Профиль
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-full text-left px-3 py-2 text-[13px] transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: INK }}
              >
                Настройки
              </button>
              <div
                className="my-1 h-px"
                style={{ background: BORDER }}
              />
              <button
                onClick={() => {
                  onNavigate('');
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[13px] transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: INK_MUTED }}
              >
                Выйти
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Header({ onNavigate, onOpenManager, page }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 flex items-center px-4 h-14"
      style={{
        background: SURFACE,
        borderBottom: `1px solid ${BORDER}`,
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      <Logo onClick={() => onNavigate('dashboard')} />
      <NavCenter page={page} onNavigate={onNavigate} />
      <RightBlock onOpenManager={onOpenManager} onNavigate={onNavigate} />
    </header>
  );
}
