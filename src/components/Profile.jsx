import { Headphones, LogOut, Mail, Building2 } from 'lucide-react'

export default function Profile({ user, onOpenManager, onLogout }) {
  const rows = [
    { label: 'ФИО', value: user?.name || 'Не указано' },
    { label: 'Email', value: user?.email || '—', icon: Mail },
    { label: 'ИНН', value: user?.inn || '—', icon: Building2 },
  ]

  return (
    <div className="animate-fade-up">
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 24, color: 'var(--color-ink)' }}>Профиль</h1>

      <section style={{ maxWidth: 640, padding: 22, marginBottom: 18, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)' }}>
        <h2 style={{ fontSize: 17, margin: '0 0 16px' }}>Данные аккаунта</h2>
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: '1px solid var(--color-surface-2)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-ink-muted)' }}>
              {Icon && <Icon size={15} />} {label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 550, textAlign: 'right' }}>{value}</span>
          </div>
        ))}
      </section>

      <section style={{ maxWidth: 640, padding: 22, marginBottom: 18, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'var(--color-accent-tint)', color: 'var(--color-accent)' }}><Headphones size={20} /></span>
          <div>
            <h2 style={{ fontSize: 16, margin: 0 }}>Команда сопровождения</h2>
            <p style={{ fontSize: 13, margin: '3px 0 0', color: 'var(--color-ink-muted)' }}>Сообщение сохранится в ваших обращениях</p>
          </div>
        </div>
        <button type="button" onClick={onOpenManager} style={{ height: 42, padding: '0 16px', border: 'none', borderRadius: 8, background: 'var(--color-accent)', color: '#fff', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>
          Написать команде
        </button>
      </section>

      <button type="button" onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 14px', border: 'none', background: 'transparent', color: 'var(--color-accent)', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>
        <LogOut size={17} /> Выйти из аккаунта
      </button>
    </div>
  )
}
