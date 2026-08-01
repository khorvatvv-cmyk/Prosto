import { useState } from 'react'

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

  const A = '#E50071', AH = '#C70060'
  const INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'

  const pageStyle = { display: 'flex', minHeight: '100vh', height: '100vh', fontFamily: 'Inter, sans-serif' }
  const leftStyle = { width: '100%', maxWidth: 480, padding: '48px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflowY: 'auto', background: S, flexShrink: 0, minHeight: '100vh' }
  const rightStyle = { flex: 1, display: 'flex', alignItems: 'center', padding: '64px 72px', background: `linear-gradient(135deg, ${S} 0%, ${S2} 100%)`, position: 'relative', overflow: 'hidden' }
  const logoStyle = { fontSize: 24, fontWeight: 800, letterSpacing: '-.03em', color: INK, position: 'absolute', top: 28, left: 48, cursor: 'pointer' }

  const tabStyle = (active) => ({ fontSize: 14, fontWeight: 500, padding: '10px 0', marginRight: 28, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', borderBottom: `2px solid ${active ? A : 'transparent'}`, color: active ? INK : L, marginBottom: -1 })
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }
  const inputStyle = { width: '100%', height: 46, border: `1px solid ${BD}`, background: S, fontSize: 15, fontFamily: 'inherit', outline: 'none', color: INK, padding: '0 14px', borderRadius: 8, transition: 'all .2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,.03)' }
  const btnPrimary = { width: '100%', height: 50, background: loading ? S2 : A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .2s' }
  const btnSecondary = { width: '100%', height: 46, background: S, color: INK, border: `1px solid #D4D4D8`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <div style={pageStyle}>
      {/* LEFT */}
      <div style={leftStyle}>
        <div style={logoStyle} onClick={() => setTab('login')}>
          просто<span style={{ color: A }}>.</span>
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid ${BD}`, marginBottom: 28 }}>
          <button style={tabStyle(tab === 'login')} onClick={() => { setTab('login'); setError('') }}>Вход</button>
          <button style={tabStyle(tab === 'register')} onClick={() => { setTab('register'); setError('') }}>Регистрация</button>
        </div>

        <div style={{ maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: A, marginBottom: 12 }}>
            Поддержка Первого Бита
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 6, color: INK }}>
            {tab === 'login' ? 'С возвращением' : 'Начните получать помощь'}
          </h1>
          <p style={{ fontSize: 15, color: M, marginBottom: 28, lineHeight: 1.6 }}>
            {tab === 'login' ? 'Опишите вопрос один раз — и не возвращайтесь к нему' : 'Расскажите, что произошло. Дальше — мы.'}
          </p>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>ФИО</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Как к вам обращаться" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                  onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
            </div>

            {tab === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>ИНН организации</label>
                <input type="text" value={inn} onChange={e => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="10 или 12 цифр" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                  onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
                <div style={{ fontSize: 13, color: M, marginTop: 6 }}>Укажите ИНН — мы идентифицируем ваш договор</div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 13, color: A, marginBottom: 14, padding: '8px 12px', background: '#FFF0F7', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? 'Подождите…' : (tab === 'login' ? 'Войти' : 'Создать аккаунт')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0', fontSize: 13, color: L }}>
            <div style={{ flex: 1, height: 1, background: BD }} />
            или
            <div style={{ flex: 1, height: 1, background: BD }} />
          </div>

          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }} style={btnSecondary}>
            {tab === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>

      {/* RIGHT — только на десктопе */}
      <div style={rightStyle} className="login-right">
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, #FFF0F7 0%, transparent 70%)', opacity: .6 }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 300, height: 300, background: '#FFF0F7', borderRadius: '50%', filter: 'blur(80px)', opacity: .4, animation: 'float 6s ease-in-out infinite' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: A, marginBottom: 16 }}>ПРОДУКТ</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.05, marginBottom: 20, color: INK }}>
            просто<span style={{ color: A }}>.</span>
          </h1>
          <p style={{ fontSize: 16, color: M, lineHeight: 1.7, marginBottom: 16 }}>
            Расскажите своими словами, что произошло. Мы разберёмся, подключим нужных специалистов и доведём вопрос до результата.
          </p>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Один раз описали — дальше мы', 'Не нужно знать, к кому обратиться', 'Контекст не теряется при передаче'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: INK }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12, color: INK }}>
            <div style={{ width: 20, height: 2, background: A }} />
            Сложное — нам. Вам — просто.
          </div>
        </div>
      </div>
    </div>
  )
}