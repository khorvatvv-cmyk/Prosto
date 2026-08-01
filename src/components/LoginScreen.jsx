import { useState } from 'react'
import { Mail, Lock, Building, User, Check, MessageCircle } from 'lucide-react'

export default function LoginScreen({ onLogin, onRegister }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inn, setInn] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await onLogin(email, password)
      } else {
        if (!inn.trim()) throw new Error('Укажите ИНН организации')
        await onRegister(email, password, inn, name)
      }
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const ACCENT = 'var(--color-accent)'
  const INK = 'var(--color-ink)'
  const INK_MUTED = 'var(--color-ink-muted)'
  const INK_LIGHT = 'var(--color-ink-light)'
  const SURFACE = 'var(--color-surface)'
  const SURFACE_2 = 'var(--color-surface-2)'
  const BORDER = 'var(--color-border)'

  const inputStyle = {
    width: '100%', height: 46, border: `1px solid ${BORDER}`, background: SURFACE,
    fontSize: 15, fontFamily: 'inherit', outline: 'none', color: INK,
    padding: '0 14px 0 40px', borderRadius: 8, transition: 'all .2s',
    boxSizing: 'border-box',
  }
  const focusStyle = (e) => {
    e.target.style.borderColor = ACCENT
    e.target.style.boxShadow = '0 0 0 4px var(--color-accent-glow)'
  }
  const blurStyle = (e) => {
    e.target.style.borderColor = BORDER
    e.target.style.boxShadow = 'none'
  }

  return (
    <div className="flex min-h-screen h-screen">
      {/* LEFT — FORM */}
      <div className="w-full md:w-[480px] md:flex-shrink-0 flex flex-col justify-center px-6 md:px-12 py-12 relative overflow-y-auto" style={{ background: SURFACE, minHeight: '100vh' }}>
        <div className="absolute top-7 left-12">
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.03em', color: INK }}>
            просто<span style={{ color: ACCENT }}>.</span>
          </span>
        </div>

        <div className="flex border-b mb-7" style={{ borderColor: BORDER }}>
          <button onClick={() => { setTab('login'); setError('') }}
            style={{ fontSize: 14, fontWeight: 500, padding: '10px 0', marginRight: 28, cursor: 'pointer',
              border: 'none', background: 'none', fontFamily: 'inherit', borderBottom: `2px solid ${tab==='login'?ACCENT:'transparent'}`,
              color: tab==='login'?INK:INK_LIGHT }}>
            Вход
          </button>
          <button onClick={() => { setTab('register'); setError('') }}
            style={{ fontSize: 14, fontWeight: 500, padding: '10px 0', cursor: 'pointer',
              border: 'none', background: 'none', fontFamily: 'inherit', borderBottom: `2px solid ${tab==='register'?ACCENT:'transparent'}`,
              color: tab==='register'?INK:INK_LIGHT }}>
            Регистрация
          </button>
        </div>

        <div style={{ maxWidth: 360, width: '100%' }} className="animate-fade-up">
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
            Поддержка Первого Бита
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 6, color: INK }}>
            {tab === 'login' ? 'С возвращением' : 'Начните получать помощь'}
          </h1>
          <p style={{ fontSize: 15, color: INK_MUTED, marginBottom: 28, lineHeight: 1.6 }}>
            {tab === 'login' ? 'Опишите вопрос один раз — и не возвращайтесь к нему' : 'Расскажите, что произошло. Дальше — мы.'}
          </p>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div style={{ marginBottom: 18, position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>ФИО</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: 15, color: INK_LIGHT }} />
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Как к вам обращаться"
                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 15, color: INK_LIGHT }} />
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 15, color: INK_LIGHT }} />
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {tab === 'register' && (
              <div style={{ marginBottom: 18, position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>ИНН организации</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: 14, top: 15, color: INK_LIGHT }} />
                  <input type="text" value={inn} onChange={e=>setInn(e.target.value.replace(/\D/g,'').slice(0,12))} placeholder="10 или 12 цифр" required
                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div style={{ fontSize: 13, color: INK_MUTED, marginTop: 6 }}>Укажите ИНН — мы идентифицируем ваш договор</div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 13, color: ACCENT, marginBottom: 14, padding: '8px 12px', background: 'var(--color-accent-tint)', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', height: 50, background: loading?'var(--color-surface-3)':ACCENT, color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading?'not-allowed':'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
              {loading ? 'Подождите…' : (tab === 'login' ? 'Войти' : 'Создать аккаунт')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0', fontSize: 13, color: INK_LIGHT }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            или
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          <button onClick={() => { setTab('login'); setError('') }}
            style={{ width: '100%', height: 46, background: SURFACE, color: INK, border: `1px solid var(--color-border-strong)`,
              borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {tab === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>

      {/* RIGHT — BRAND */}
      <div className="flex-1 hidden md:flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${SURFACE} 0%, ${SURFACE_2} 100%)` }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '60%',
          background: `radial-gradient(circle, var(--color-accent-tint) 0%, transparent 70%)`, opacity: .6 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40%', height: '40%',
          background: `radial-gradient(circle, ${SURFACE_2} 0%, transparent 70%)`, opacity: .4 }} />
        <div className="animate-float" style={{ position: 'absolute', top: '20%', right: '10%', width: 300, height: 300,
          background: 'var(--color-accent-tint)', borderRadius: '50%', filter: 'blur(80px)', opacity: .4 }} />

        <div className="animate-fade-up relative z-10 max-w-[420px]">
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 16 }}>
            ПРОДУКТ
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.05, marginBottom: 20, color: INK }}>
            просто<span style={{ color: ACCENT }}>.</span>
          </h1>
          <p style={{ fontSize: 16, color: INK_MUTED, lineHeight: 1.7, marginBottom: 16 }}>
            Расскажите своими словами, что произошло. Мы разберёмся, подключим нужных специалистов и доведём вопрос до результата.
          </p>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Один раз описали — дальше мы',
              'Не нужно знать, к кому обратиться',
              'Контекст не теряется при передаче',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: INK }}>
                <Check size={18} style={{ color: ACCENT, flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12, color: INK }}>
            <div style={{ width: 20, height: 2, background: ACCENT }} />
            Сложное — нам. Вам — просто.
          </div>
        </div>
      </div>
    </div>
  )
}
