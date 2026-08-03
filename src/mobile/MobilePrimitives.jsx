import { useEffect, useId } from 'react'
import { AlertCircle, RotateCcw, X } from 'lucide-react'

export function MobileButton({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return <button className={`m-button m-button--${variant} m-button--${size} ${className}`} {...props}>{children}</button>
}
export function MobileBadge({ tone = 'neutral', children }) {
  return <span className={`m-badge m-badge--${tone}`}>{children}</span>
}

export function MobileAvatar({ name = '', src, size = 'md' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'П'
  return (
    <span className={`m-avatar m-avatar--${size}`} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initials}
    </span>
  )
}

export function MobileSkeleton({ className = '' }) {
  return <span className={`m-skeleton ${className}`} aria-hidden="true" />
}

export function MobileScreenSkeleton({ cards = 3 }) {
  return (
    <div className="m-screen-skeleton" aria-label="Загрузка">
      <MobileSkeleton className="m-skeleton-title" />
      <MobileSkeleton className="m-skeleton-subtitle" />
      {Array.from({ length: cards }).map((_, index) => <MobileSkeleton key={index} className="m-skeleton-card" />)}
    </div>
  )
}

export function MobileError({ title = 'Не удалось загрузить данные', message, onRetry }) {
  return (
    <div className="m-state" role="alert">
      <span className="m-state-icon"><AlertCircle size={24} /></span>
      <h2>{title}</h2>
      <p>{message || 'Проверьте подключение и попробуйте ещё раз.'}</p>
      {onRetry && <MobileButton variant="secondary" onClick={onRetry}><RotateCcw size={17} /> Повторить</MobileButton>}
    </div>
  )
}

export function MobileEmpty({ icon: Icon, title, text, action }) {
  return (
    <div className="m-state m-state--empty">
      {Icon && <span className="m-state-icon"><Icon size={25} /></span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function MobileTabs({ items, active, onChange, label }) {
  return (
    <div className="m-tabs" role="tablist" aria-label={label}>
      {items.map(item => (
        <button key={item.id} type="button" role="tab" aria-selected={active === item.id}
          className={active === item.id ? 'is-active' : ''} onClick={() => onChange(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function MobileSheet({ open, title, onClose, children }) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="m-sheet-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="m-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="m-sheet-handle" aria-hidden="true" />
        <header><h2 id={titleId}>{title}</h2><button type="button" aria-label="Закрыть" onClick={onClose}><X size={21} /></button></header>
        <div className="m-sheet-body">{children}</div>
      </section>
    </div>
  )
}
