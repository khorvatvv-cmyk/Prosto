import { useState } from 'react'
import { MessageCirclePlus } from 'lucide-react'

export default function NewRequest({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const A = '#E50071', AH = '#C70060'
  const INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Опишите, что случилось'); return }
    setLoading(true)
    try {
      const submitted = await onSubmit(title.trim(), desc.trim())
      if (!submitted) setError('Не удалось отправить вопрос. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = { width: '100%', border: `1px solid ${BD}`, background: S, fontSize: 15, fontFamily: 'inherit', outline: 'none', color: INK, padding: '12px 14px', borderRadius: 8, transition: 'all .2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,.03)' }

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, fontSize: 13 }}>
        <span onClick={onCancel} style={{ color: M, cursor: 'pointer' }} onMouseEnter={e=>e.target.style.color=A} onMouseLeave={e=>e.target.style.color=M}>Вопросы</span>
        <span style={{ color: '#D4D4D8' }}>/</span>
        <span style={{ color: INK, fontWeight: 500 }}>Новый вопрос</span>
      </div>

      {/* Header */}
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 8, color: INK }}>
        Опишите вопрос —<br/>
        <span style={{ background: `linear-gradient(135deg, ${INK} 0%, ${A} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          остальное сделаем мы
        </span>
      </h1>
      <p style={{ fontSize: 15, color: M, marginBottom: 28, maxWidth: 500, lineHeight: 1.6 }}>
        Чем подробнее опишете — тем точнее ответ. Сначала ответит ассистент ПРОСТО. Если потребуется — подключим специалиста. Не нужно будет повторять.
      </p>

      <div style={{ maxWidth: 620 }}>
        {/* Title */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>О чём речь</label>
          <input type="text" value={title} onChange={e => { setTitle(e.target.value); setError('') }}
            placeholder="Например: не проводится документ в 1С"
            style={{ ...inputBase, borderColor: error ? A : BD }}
            onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
            onBlur={e => { e.target.style.borderColor = error ? A : BD; e.target.style.boxShadow = 'none' }} />
          {error && <div style={{ fontSize: 12, color: A, marginTop: 5 }}>{error}</div>}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L, marginBottom: 8 }}>Расскажите подробнее</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Что произошло? Какие действия выполняли? Что ожидали увидеть? Укажите конфигурацию и релиз 1С."
            style={{ ...inputBase, minHeight: 130, resize: 'vertical', lineHeight: 1.6, borderRadius: 10 }}
            onFocus={e => { e.target.style.borderColor = A; e.target.style.boxShadow = '0 0 0 4px rgba(229,0,113,.1)' }}
            onBlur={e => { e.target.style.borderColor = BD; e.target.style.boxShadow = 'none' }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
          <button onClick={onCancel} style={{ background: 'transparent', color: M, border: 'none', padding: '0 12px', height: 44, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ background: loading ? S2 : A, color: '#fff', border: 'none', padding: '0 26px', height: 50, fontSize: 15, fontWeight: 600, borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all .2s', boxShadow: loading ? 'none' : '0 4px 14px rgba(229,0,113,.2)' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = AH; e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,0,113,.3)' } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = A; e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,0,113,.2)' } }}>
            <MessageCirclePlus size={18} /> {loading ? 'Отправка…' : 'Просто спросить'}
          </button>
        </div>
      </div>
    </div>
  )
}
