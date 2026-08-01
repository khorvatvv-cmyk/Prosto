import { useState } from 'react'
import { Upload, X, MessageCirclePlus } from 'lucide-react'

export default function NewRequest({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ACCENT = 'var(--color-accent)'
  const INK = 'var(--color-ink)'
  const INK_MUTED = 'var(--color-ink-muted)'
  const INK_LIGHT = 'var(--color-ink-light)'
  const SURFACE = 'var(--color-surface)'
  const SURFACE_2 = 'var(--color-surface-2)'
  const BORDER = 'var(--color-border)'

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Опишите, что случилось')
      return
    }
    setLoading(true)
    onSubmit(title.trim(), desc.trim())
  }

  const addFile = () => {
    setFiles(prev => [...prev, { name: `Файл ${prev.length + 1}.png`, size: '245 КБ' }])
  }

  const inputStyle = {
    width: '100%', border: `1px solid ${BORDER}`, background: SURFACE, fontSize: 15,
    fontFamily: 'inherit', outline: 'none', color: INK, padding: '12px 14px', borderRadius: 8,
    transition: 'all .2s', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,.03)',
  }

  return (
    <div className="animate-fade-up">
      <div className="flex gap-2 mb-6" style={{ fontSize: 13 }}>
        <a onClick={onCancel} style={{ color: INK_MUTED, cursor: 'pointer' }} onMouseEnter={e=>e.target.style.color=ACCENT} onMouseLeave={e=>e.target.style.color=INK_MUTED}>Вопросы</a>
        <span style={{ color: 'var(--color-ink-faint)' }}>/</span>
        <span style={{ color: INK, fontWeight: 500 }}>Новый вопрос</span>
      </div>

      <div className="flex items-start justify-between mb-2">
        <h1 className="gradient-text" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em' }}>Что случилось?</h1>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT }}>ШАГ 1 / 1</div>
      </div>
      <p style={{ fontSize: 15, color: INK_MUTED, marginBottom: 28, maxWidth: 500, lineHeight: 1.6 }}>
        Не нужно определять тип проблемы или искать специалиста. Просто опишите ситуацию.
      </p>

      <div style={{ maxWidth: 620 }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>О чём речь</label>
          <input type="text" value={title} onChange={e => { setTitle(e.target.value); setError('') }}
            placeholder="Например: не проводится документ в 1С"
            style={{ ...inputStyle, borderColor: error ? ACCENT : BORDER }}
            onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = '0 0 0 4px var(--color-accent-glow)' }}
            onBlur={e => { e.target.style.borderColor = error ? ACCENT : BORDER; e.target.style.boxShadow = 'none' }} />
          {error && <div style={{ fontSize: 12, color: ACCENT, marginTop: 5 }}>{error}</div>}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>Расскажите подробнее</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Что произошло? Какие действия выполняли? Что ожидали увидеть? Укажите конфигурацию и релиз 1С."
            style={{ ...inputStyle, minHeight: 130, resize: 'vertical', lineHeight: 1.6, borderRadius: 10 }}
            onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = '0 0 0 4px var(--color-accent-glow)' }}
            onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none' }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 8 }}>Вложения</label>
          <div onClick={addFile} className="cursor-pointer"
            style={{ border: '1.5px dashed var(--color-border-strong)', padding: 26, textAlign: 'center', fontSize: 14, color: INK_MUTED, borderRadius: 10, background: SURFACE, transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = 'var(--color-accent-tint)'; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.background = SURFACE; e.currentTarget.style.color = INK_MUTED }}>
            <Upload size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Перетащите файлы или нажмите для выбора
          </div>
          {files.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between" style={{ padding: '10px 14px', background: SURFACE_2, fontSize: 13, borderRadius: 6 }}>
                  <span>{f.name} ({f.size})</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: INK_MUTED, fontSize: 18, padding: '0 4px' }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center" style={{ marginTop: 36 }}>
          <button onClick={onCancel} style={{ background: 'transparent', color: INK_MUTED, border: 'none', padding: '0 12px', height: 44, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="inline-flex items-center gap-2"
            style={{ background: loading ? 'var(--color-surface-3)' : ACCENT, color: '#fff', border: 'none', padding: '0 26px', height: 50, fontSize: 15, fontWeight: 600, borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
            <MessageCirclePlus size={18} /> {loading ? 'Отправка…' : 'Просто спросить'}
          </button>
        </div>
      </div>
    </div>
  )
}
