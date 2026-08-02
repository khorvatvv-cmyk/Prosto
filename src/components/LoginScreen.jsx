import { useEffect, useState } from 'react'
import { systemApi } from '../api.js'

export default function LoginScreen({ onLogin, onRegister }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inn, setInn] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectionText, setConnectionText] = useState('')
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    let active = true
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    systemApi.wake()
      .then(() => {
        if (active) setConnectionText('')
      })
      .catch(() => {
        if (active && navigator.onLine) setConnectionText('Сервер запускается — вход может занять несколько секунд')
      })

    return () => {
      active = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleProgress = ({ phase, attempt }) => {
    if (phase === 'request') {
      setConnectionText(attempt > 1 ? 'Повторно соединяемся с сервером…' : 'Проверяем данные…')
    } else if (phase === 'retry') {
      setConnectionText('Сервер отвечает медленно. Пробуем ещё раз…')
    } else if (phase === 'success') {
      setConnectionText('')
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setError('')
    if (!navigator.onLine) {
      setError('Нет подключения к интернету. Проверьте мобильную сеть или Wi-Fi.')
      return
    }
    setLoading(true)
    try {
      if (tab === 'login') {
        await onLogin(email, password, handleProgress)
      } else {
        if (!inn.trim()) throw new Error('Укажите ИНН организации')
        await onRegister(email, password, inn, name, handleProgress)
      }
    } catch (err) {
      if (err.code === 'timeout' || err.code === 'network_error') {
        setError('Не удалось связаться с сервером. Проверьте интернет и нажмите «Войти» ещё раз.')
      } else {
        setError(err.message || 'Ошибка')
      }
    } finally {
      setLoading(false)
      setConnectionText('')
    }
  }

  const A = '#E50071'
  const INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'

  return (
    <div className="login-shell" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* LEFT — FORM */}
      <div className="login-panel" style={{ width: '100%', maxWidth: 460, flexShrink: 0, background: S, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Logo bar */}
        <div className="login-logo" style={{ padding: '24px 40px', borderBottom: `1px solid ${BD}` }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.03em', color: INK }}>
            просто<span style={{ color: A }}>.</span>
          </span>
        </div>

        {/* Form area */}
        <div className="login-form-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 40px 60px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${BD}`, marginBottom: 32 }}>
            <button type="button" onClick={() => { setTab('login'); setError('') }}
              style={{ fontSize: 14, fontWeight: 600, padding: '10px 0', marginRight: 28, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', borderBottom: `2px solid ${tab==='login'?A:'transparent'}`, color: tab==='login'?INK:L, marginBottom: -1 }}>
              Вход
            </button>
            <button type="button" onClick={() => { setTab('register'); setError('') }}
              style={{ fontSize: 14, fontWeight: 600, padding: '10px 0', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', borderBottom: `2px solid ${tab==='register'?A:'transparent'}`, color: tab==='register'?INK:L, marginBottom: -1 }}>
              Регистрация
            </button>
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: A, marginBottom: 12 }}>
            Поддержка Первого Бита
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 6, color: INK, lineHeight: 1.2 }}>
            {tab === 'login' ? 'С возвращением' : 'Начните получать помощь'}
          </h1>
          <p style={{ fontSize: 15, color: M, marginBottom: 28, lineHeight: 1.6 }}>
            {tab === 'login' ? 'Опишите вопрос один раз — и не возвращайтесь к нему' : 'Расскажите, что произошло. Дальше — мы.'}
          </p>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>ФИО</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Как к вам обращаться"
                  style={{ width: '100%', height: 46, border: `1px solid ${BD}`, background: S, fontSize: 15, fontFamily: 'inherit', outline: 'none', color: INK, padding: '0 14px', borderRadius: 8, transition: 'all .2s', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                  onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" inputMode="email" enterKeyHint="next" autoCapitalize="none"
                style={{ width: '100%', height: 46, border: `1px solid ${BD}`, background: S, fontSize: 16, fontFamily: 'inherit', outline: 'none', color: INK, padding: '0 14px', borderRadius: 8, transition: 'all .2s', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete={tab === 'login' ? 'current-password' : 'new-password'} enterKeyHint="go"
                style={{ width: '100%', height: 46, border: `1px solid ${BD}`, background: S, fontSize: 16, fontFamily: 'inherit', outline: 'none', color: INK, padding: '0 14px', borderRadius: 8, transition: 'all .2s', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
            </div>

            {tab === 'register' && (
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>ИНН организации</label>
                <input type="text" value={inn} onChange={e => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="10 или 12 цифр" required
                  style={{ width: '100%', height: 46, border: `1px solid ${BD}`, background: S, fontSize: 15, fontFamily: 'inherit', outline: 'none', color: INK, padding: '0 14px', borderRadius: 8, transition: 'all .2s', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
                  onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
                <div style={{ fontSize: 13, color: M, marginTop: 6 }}>Укажите ИНН — мы идентифицируем ваш договор</div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 13, color: A, marginBottom: 14, padding: '10px 14px', background: '#FFF0F7', borderRadius: 8, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            {!error && (!online || connectionText) && (
              <div role="status" style={{ fontSize: 13, color: online ? M : A, marginBottom: 14, lineHeight: 1.5 }}>
                {online ? connectionText : 'Нет подключения к интернету'}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', height: 50, background: loading ? S2 : A, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .2s', boxShadow: loading ? 'none' : '0 2px 8px rgba(229,0,113,.2)' }}>
              {loading ? (connectionText || 'Входим…') : (tab === 'login' ? 'Войти' : 'Создать аккаунт')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0', fontSize: 13, color: L }}>
            <div style={{ flex: 1, height: 1, background: BD }} />
            или
            <div style={{ flex: 1, height: 1, background: BD }} />
          </div>

          <button type="button" onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }}
            style={{ width: '100%', height: 46, background: S, color: INK, border: '1px solid #D4D4D8', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {tab === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>

      {/* RIGHT — BRAND (desktop only) */}
      <div className="login-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 72px', background: `linear-gradient(135deg, ${S} 0%, ${S2} 100%)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, #FFF0F7 0%, transparent 70%)', opacity: .8 }} />
        <div style={{ position: 'absolute', top: '15%', right: '8%', width: 280, height: 280, background: '#FFF0F7', borderRadius: '50%', filter: 'blur(80px)', opacity: .5, animation: 'float 6s ease-in-out infinite' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 400 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: A, marginBottom: 16 }}>ПРОДУКТ</div>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.05, marginBottom: 20, color: INK }}>
            просто<span style={{ color: A }}>.</span>
          </h1>
          <p style={{ fontSize: 16, color: M, lineHeight: 1.7, marginBottom: 20 }}>
            Расскажите своими словами, что произошло. Мы разберёмся, подключим нужных специалистов и доведём вопрос до результата.
          </p>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Один раз описали — дальше мы', 'Не нужно знать, к кому обратиться', 'Контекст не теряется при передаче'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: INK }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: '#FFF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                {t}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12, color: INK }}>
            <div style={{ width: 24, height: 2, background: A }} />
            Сложное — нам. Вам — просто.
          </div>
        </div>
      </div>
    </div>
  )
}
