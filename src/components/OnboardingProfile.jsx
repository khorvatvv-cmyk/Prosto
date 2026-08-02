import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { profileApi } from '../api.js'

export default function OnboardingProfile({ user, onComplete }) {
  const [activityType, setActivityType] = useState(user?.activity_type || '')
  const [softwareProduct, setSoftwareProduct] = useState(user?.software_product || '')
  const [productVersion, setProductVersion] = useState(user?.product_version || '')
  const [configType, setConfigType] = useState(user?.config_type || '')
  const [customizations, setCustomizations] = useState(user?.customizations || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const A = '#E50071'
  const INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'

  const inputBase = {
    width: '100%', height: 46, border: `1px solid ${BD}`, background: S,
    fontSize: 15, fontFamily: 'inherit', outline: 'none', color: INK,
    padding: '0 14px', borderRadius: 8, transition: 'all .2s', boxSizing: 'border-box',
  }

  const focusStyle = (e) => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }
  const blurStyle = (e) => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      await profileApi.update({
        activity_type: activityType,
        software_product: softwareProduct,
        product_version: productVersion,
        config_type: configType,
        customizations: customizations,
      })
      onComplete()
    } catch (e) {
      setError(e.message || 'Не удалось сохранить')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const fields = [
    {
      label: 'Вид деятельности',
      value: activityType,
      set: setActivityType,
      placeholder: 'Например: оптовая торговля',
      type: 'text',
    },
    {
      label: 'Программный продукт',
      value: softwareProduct,
      set: setSoftwareProduct,
      placeholder: 'Например: 1С:Управление торговлей',
      type: 'text',
    },
    {
      label: 'Версия',
      value: productVersion,
      set: setProductVersion,
      placeholder: 'Например: 11.5',
      type: 'text',
    },
    {
      label: 'Типовая или нетиповая конфигурация',
      value: configType,
      set: setConfigType,
      placeholder: 'Выберите вариант',
      type: 'select',
      options: ['', 'Типовая', 'Нетиповая'],
    },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: S, padding: '32px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color={A} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.03em', color: INK }}>
            просто<span style={{ color: A }}>.</span>
          </span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 8, color: INK, lineHeight: 1.2 }}>
          Расскажите о вашей 1С
        </h1>
        <p style={{ fontSize: 15, color: M, marginBottom: 28, lineHeight: 1.6 }}>
          Эти данные помогут ассистенту точнее отвечать на вопросы. Заполнить можно и позже — в профиле.
        </p>

        {fields.map((field) => (
          <div key={field.label} style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                style={{ ...inputBase, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B70' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt || '— не указано —'}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={field.value}
                onChange={(e) => { field.set(e.target.value); setError('') }}
                placeholder={field.placeholder}
                style={inputBase}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            )}
          </div>
        ))}

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>Что доработано</label>
          <textarea
            value={customizations}
            onChange={(e) => setCustomizations(e.target.value)}
            placeholder="Например: добавлен обмен с сайтом, доработаны печатные формы"
            style={{ ...inputBase, height: 'auto', minHeight: 80, resize: 'vertical', padding: '12px 14px', lineHeight: 1.6, borderRadius: 10 }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

        {error && (
          <div style={{ fontSize: 13, color: A, marginBottom: 14, padding: '10px 14px', background: '#FFF0F7', borderRadius: 8, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              width: '100%', height: 50, background: loading ? S2 : A, color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              transition: 'all .2s', boxShadow: loading ? 'none' : '0 2px 8px rgba(229,0,113,.2)',
            }}
          >
            {loading ? 'Сохранение…' : 'Сохранить и продолжить'}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            style={{
              width: '100%', height: 46, background: 'transparent', color: M,
              border: `1px solid ${BD}`, borderRadius: 10, fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            Заполнить позже
          </button>
        </div>
      </div>
    </div>
  )
}
