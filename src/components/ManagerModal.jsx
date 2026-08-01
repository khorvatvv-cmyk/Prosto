import { useState, useEffect, useCallback } from 'react'
import { X, Send, Headphones } from 'lucide-react'

export default function ManagerModal({ onClose, onSend }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && !sending) onClose?.()
  }, [onClose, sending])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [handleKeyDown])

  const handleSend = async () => {
    const message = text.trim()
    if (!message || sending) return

    setSending(true)
    setError('')
    try {
      await onSend(message)
      onClose?.()
    } catch (sendError) {
      setError(sendError.message || 'Не удалось отправить сообщение')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      role="presentation"
      onClick={(event) => { if (event.target === event.currentTarget && !sending) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,.38)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-dialog-title"
        style={{
          width: '100%', maxWidth: 480, backgroundColor: 'var(--color-surface)',
          borderRadius: 18, padding: '24px', position: 'relative',
          boxShadow: '0 24px 70px rgba(0,0,0,.22)', animation: 'fadeUp .25s ease both',
        }}
      >
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          disabled={sending}
          style={{
            position: 'absolute', top: 16, right: 16, width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
            border: 'none', backgroundColor: 'var(--color-surface-2)',
            color: 'var(--color-ink-muted)', cursor: sending ? 'not-allowed' : 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--color-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Headphones size={22} />
        </div>
        <h2 id="manager-dialog-title" style={{ margin: '0 44px 8px 0', fontSize: 21, fontWeight: 750, color: 'var(--color-ink)' }}>
          Команда сопровождения
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-muted)' }}>
          Опишите вопрос один раз. Сообщение появится в ваших обращениях со статусом «В работе».
        </p>

        <label htmlFor="manager-message" style={{ display: 'block', fontSize: 11, fontWeight: 650, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-ink-light)', marginBottom: 8 }}>
          Сообщение
        </label>
        <textarea
          id="manager-message"
          autoFocus
          value={text}
          onChange={(event) => { setText(event.target.value); setError('') }}
          placeholder="Что нужно уточнить или передать команде?"
          rows={5}
          maxLength={10000}
          style={{
            width: '100%', padding: '12px 14px', fontSize: 14, lineHeight: 1.5,
            color: 'var(--color-ink)', backgroundColor: 'var(--color-surface)',
            border: `1px solid ${error ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            fontFamily: 'inherit', minHeight: 120,
          }}
        />
        {error && <div role="alert" style={{ color: 'var(--color-accent)', fontSize: 13, marginTop: 8 }}>{error}</div>}

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', marginTop: 16, height: 46, fontSize: 14, fontWeight: 650,
            color: '#fff', backgroundColor: text.trim() && !sending ? 'var(--color-accent)' : 'var(--color-ink-light)',
            border: 'none', borderRadius: 10, cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
          }}
        >
          <Send size={16} />
          {sending ? 'Отправляем…' : 'Передать команде'}
        </button>
      </div>
    </div>
  )
}
