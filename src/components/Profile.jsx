import { Lock, LogOut, Phone, Mail, Building } from 'lucide-react'

export default function Profile({ user, onOpenManager, showToast, onLogout }) {
  const ACCENT = 'var(--color-accent)'
  const INK = 'var(--color-ink)'
  const INK_MUTED = 'var(--color-ink-muted)'
  const INK_LIGHT = 'var(--color-ink-light)'
  const SURFACE = 'var(--color-surface)'
  const SURFACE_2 = 'var(--color-surface-2)'
  const BORDER = 'var(--color-border)'

  const inputStyle = {
    width: '100%', border: `1px solid ${BORDER}`, background: SURFACE, fontSize: 15,
    fontFamily: 'inherit', outline: 'none', color: INK, padding: '12px 14px', borderRadius: 8,
    transition: 'all .2s', boxSizing: 'border-box',
  }

  const Section = ({ title, children }) => (
    <div style={{ paddingBottom: 30, marginBottom: 30, borderBottom: `1px solid ${BORDER}` }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="animate-fade-up">
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 30, color: INK }}>Профиль</h1>

      <Section title="Контакт">
        <div style={{ maxWidth: 620 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>ФИО</label>
            <input type="text" defaultValue={user?.name || ''} placeholder="Как к вам обращаться" style={inputStyle}
              onFocus={e=>{e.target.style.borderColor=ACCENT;e.target.style.boxShadow='0 0 0 4px var(--color-accent-glow)'}}
              onBlur={e=>{e.target.style.borderColor=BORDER;e.target.style.boxShadow='none'}} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>Email</label>
            <input type="email" defaultValue={user?.email || ''} style={inputStyle} disabled
              onFocus={e=>{e.target.style.borderColor=ACCENT;e.target.style.boxShadow='0 0 0 4px var(--color-accent-glow)'}}
              onBlur={e=>{e.target.style.borderColor=BORDER;e.target.style.boxShadow='none'}} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>ИНН</label>
            <input type="text" defaultValue={user?.inn || ''} style={inputStyle} disabled />
          </div>
          <button onClick={() => showToast('Данные сохранены')}
            style={{ background: ACCENT, color: '#fff', border: 'none', padding: '0 22px', height: 44, fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            Сохранить
          </button>
        </div>
      </Section>

      <Section title="Организация">
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, padding: 22, maxWidth: 620, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <span style={{ fontSize: 13, color: INK_MUTED }}>ИНН</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.inn || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${SURFACE_2}` }}>
            <span style={{ fontSize: 13, color: INK_MUTED }}>Email</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.email || '—'}</span>
          </div>
        </div>
      </Section>

      <Section title="Ваш менеджер">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, background: SURFACE_2, borderRadius: 10, maxWidth: 620 }}>
          <div style={{ width: 46, height: 46, background: `linear-gradient(135deg, ${INK} 0%, ${ACCENT} 100%)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, borderRadius: '50%' }}>ИИ</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Иванов Иван Иванович</div>
            <div style={{ fontSize: 13, color: INK_MUTED }}>Персональный менеджер · Офис Кемерово</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, maxWidth: 620 }}>
          <div onClick={() => window.open('tel:+79051234567')} className="cursor-pointer flex items-center gap-3"
            style={{ padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: 8, background: SURFACE, fontSize: 14, transition: 'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.color=ACCENT}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=INK}}>
            <Phone size={18} /> +7 (905) 123-45-67
          </div>
          <div onClick={() => window.open('mailto:ivanov@1cbit.ru')} className="cursor-pointer flex items-center gap-3"
            style={{ padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: 8, background: SURFACE, fontSize: 14, transition: 'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.color=ACCENT}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=INK}}>
            <Mail size={18} /> ivanov@1cbit.ru
          </div>
        </div>
      </Section>

      <div style={{ paddingBottom: 30 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Безопасность</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => showToast('Настройки пароля')} className="inline-flex items-center gap-2"
            style={{ alignSelf: 'flex-start', background: SURFACE, color: INK, border: `1px solid var(--color-border-strong)`, padding: '0 18px', height: 44, fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Lock size={16} /> Изменить пароль
          </button>
          <button onClick={onLogout} className="inline-flex items-center gap-2"
            style={{ alignSelf: 'flex-start', background: 'transparent', color: ACCENT, border: 'none', padding: '0 12px', height: 44, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <LogOut size={16} /> Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  )
}
