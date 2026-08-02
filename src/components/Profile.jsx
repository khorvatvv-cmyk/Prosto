import { useState } from 'react'
import { Headphones, LogOut, Mail, Building2, Settings2, Check } from 'lucide-react'
import { profileApi } from '../api.js'

export default function Profile({ user, onOpenManager, onLogout, onUpdateUser }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [activityType, setActivityType] = useState(user?.activity_type || '')
  const [softwareProduct, setSoftwareProduct] = useState(user?.software_product || '')
  const [productVersion, setProductVersion] = useState(user?.product_version || '')
  const [configType, setConfigType] = useState(user?.config_type || '')
  const [customizations, setCustomizations] = useState(user?.customizations || '')

  const A = '#E50071'
  const INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'
  const isClientProfile = user?.role === 'user' || user?.role === 'admin'

  const rows = [
    { label: 'ФИО', value: user?.name || 'Не указано' },
    { label: 'Email', value: user?.email || '—', icon: Mail },
    { label: 'ИНН', value: user?.inn || '—', icon: Building2 },
  ]

  const profileRows = [
    { label: 'Вид деятельности', value: user?.activity_type || 'Не указано' },
    { label: 'Программный продукт', value: user?.software_product || 'Не указано' },
    { label: 'Версия', value: user?.product_version || 'Не указано' },
    { label: 'Конфигурация', value: user?.config_type || 'Не указано' },
    { label: 'Что доработано', value: user?.customizations || 'Не указано' },
  ]

  const inputBase = {
    width: '100%', height: 44, border: `1px solid ${BD}`, background: S,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', color: INK,
    padding: '0 12px', borderRadius: 8, transition: 'all .2s', boxSizing: 'border-box',
  }
  const focusStyle = (e) => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }
  const blurStyle = (e) => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const data = await profileApi.update({
        activity_type: activityType,
        software_product: softwareProduct,
        product_version: productVersion,
        config_type: configType,
        customizations: customizations,
      })
      if (onUpdateUser) onUpdateUser(data.user)
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (e) {
      setError(e.message || 'Не удалось сохранить')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setActivityType(user?.activity_type || '')
    setSoftwareProduct(user?.software_product || '')
    setProductVersion(user?.product_version || '')
    setConfigType(user?.config_type || '')
    setCustomizations(user?.customizations || '')
    setEditing(false)
    setError('')
  }

  const editFields = [
    { label: 'Вид деятельности', value: activityType, set: setActivityType, placeholder: 'Например: оптовая торговля', type: 'text' },
    { label: 'Программный продукт', value: softwareProduct, set: setSoftwareProduct, placeholder: 'Например: 1С:Управление торговлей', type: 'text' },
    { label: 'Версия', value: productVersion, set: setProductVersion, placeholder: 'Например: 11.5', type: 'text' },
    { label: 'Типовая или нетиповая конфигурация', value: configType, set: setConfigType, placeholder: 'Выберите вариант', type: 'select', options: ['', 'Типовая', 'Нетиповая'] },
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

      {isClientProfile && <section style={{ maxWidth: 640, padding: 22, marginBottom: 18, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'var(--color-accent-tint)', color: 'var(--color-accent)' }}><Settings2 size={20} /></span>
            <div>
              <h2 style={{ fontSize: 16, margin: 0 }}>Контекст для ИИ</h2>
              <p style={{ fontSize: 13, margin: '3px 0 0', color: 'var(--color-ink-muted)' }}>Помогает ассистенту точнее отвечать</p>
            </div>
          </div>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} style={{ height: 36, padding: '0 14px', border: `1px solid ${BD}`, background: S, color: INK, fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
              Изменить
            </button>
          )}
        </div>

        {success && (
          <div style={{ fontSize: 13, color: '#16A34A', marginBottom: 12, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} /> Сохранено
          </div>
        )}

        {error && (
          <div style={{ fontSize: 13, color: A, marginBottom: 12, padding: '8px 12px', background: '#FFF0F7', borderRadius: 8 }}>
            {error}
          </div>
        )}

        {!editing ? (
          profileRows.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: '1px solid var(--color-surface-2)' }}>
              <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 550, textAlign: 'right', color: value === 'Не указано' ? L : INK }}>{value}</span>
            </div>
          ))
        ) : (
          <div>
            {editFields.map((field) => (
              <div key={field.label} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 6 }}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    style={{ ...inputBase, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B70' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt || '— не указано —'}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={field.value} onChange={(e) => field.set(e.target.value)} placeholder={field.placeholder} style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
                )}
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 6 }}>Что доработано</label>
              <textarea value={customizations} onChange={(e) => setCustomizations(e.target.value)} placeholder="Например: добавлен обмен с сайтом, доработаны печатные формы" style={{ ...inputBase, height: 'auto', minHeight: 72, resize: 'vertical', padding: '10px 12px', lineHeight: 1.6, borderRadius: 8 }} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={handleSave} disabled={loading} style={{ height: 42, padding: '0 20px', background: loading ? S2 : A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} disabled={loading} style={{ height: 42, padding: '0 16px', background: 'transparent', color: M, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Отмена
              </button>
            </div>
          </div>
        )}
      </section>}

      {isClientProfile && <section style={{ maxWidth: 640, padding: 22, marginBottom: 18, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface-2)' }}>
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
      </section>}

      <button type="button" onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 14px', border: 'none', background: 'transparent', color: 'var(--color-accent)', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>
        <LogOut size={17} /> Выйти из аккаунта
      </button>
    </div>
  )
}
