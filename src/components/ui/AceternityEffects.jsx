import { AnimatePresence, motion } from 'motion/react'
import { cloneElement, createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'

// Adapted from the interaction mechanics published at ui.aceternity.com.
// Demo layouts, dark themes and multi-colour palettes are intentionally omitted.

export function PointerGlowArea({ children, className = '' }) {
  const areaRef = useRef(null)
  const glowRef = useRef(null)
  const frameRef = useRef(0)
  const enabledRef = useRef(false)
  const pointRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  useEffect(() => {
    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 769px)').matches
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    enabledRef.current = enabled
    if (!enabled) return undefined
    const animate = () => {
      const point = pointRef.current
      point.x += (point.tx - point.x) / 12
      point.y += (point.ty - point.y) / 12
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${Math.round(point.x - 110)}px, ${Math.round(point.y - 110)}px, 0)`
      }
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const handlePointerMove = (event) => {
    if (!enabledRef.current || (event.pointerType && event.pointerType !== 'mouse')) return
    const rect = areaRef.current?.getBoundingClientRect()
    if (!rect) return
    pointRef.current.tx = event.clientX - rect.left
    pointRef.current.ty = event.clientY - rect.top
  }

  return (
    <div
      ref={areaRef}
      className={`aceternity-workspace-glow ${className}`}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => enabledRef.current && glowRef.current?.classList.add('is-visible')}
      onPointerLeave={() => glowRef.current?.classList.remove('is-visible')}
    >
      <div ref={glowRef} className="aceternity-pointer-glow" aria-hidden="true" />
      <div className="aceternity-workspace-content">{children}</div>
    </div>
  )
}

export function GlowingCard({ children, className = '', contentClassName = '', contentStyle, style, spotlight = false, active = false, ...props }) {
  const ref = useRef(null)

  const handlePointerMove = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return
    const element = ref.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    element.style.setProperty('--glow-x', `${event.clientX - rect.left}px`)
    element.style.setProperty('--glow-y', `${event.clientY - rect.top}px`)
    element.style.setProperty('--glow-active', '1')
  }

  const handlePointerLeave = () => {
    ref.current?.style.setProperty('--glow-active', active ? '.35' : '0')
  }

  return (
    <div
      ref={ref}
      className={`aceternity-glowing-card ${spotlight ? 'has-spotlight' : ''} ${active ? 'is-active' : ''} ${className}`}
      style={{ '--glow-active': active ? '.35' : '0', ...style }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div className="aceternity-glow-border" aria-hidden="true" />
      {spotlight && <div className="aceternity-card-spotlight" aria-hidden="true" />}
      <div className={`aceternity-card-content ${contentClassName}`} style={contentStyle}>{children}</div>
    </div>
  )
}

const HoverContext = createContext(null)

export function HoverGroup({ children, className = '', gap = 8, id }) {
  const [hovered, setHovered] = useState(null)
  const generatedId = useId()
  const layoutId = `prosto-hover-${id || generatedId.replaceAll(':', '')}`
  return (
    <HoverContext.Provider value={{ hovered, setHovered, layoutId }}>
      <div className={`aceternity-hover-group ${className}`} style={{ gap }}>{children}</div>
    </HoverContext.Provider>
  )
}

export function HoverItem({ index, children, className = '', style, active = false, glow = false, ...props }) {
  const context = useContext(HoverContext)
  const ref = useRef(null)
  if (!context) return children
  const { hovered, setHovered, layoutId } = context
  const handlePointerMove = (event) => {
    if (!glow || (event.pointerType && event.pointerType !== 'mouse')) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    ref.current.style.setProperty('--glow-x', `${event.clientX - rect.left}px`)
    ref.current.style.setProperty('--glow-y', `${event.clientY - rect.top}px`)
    ref.current.style.setProperty('--glow-active', '1')
  }
  return (
    <div
      ref={ref}
      className={`aceternity-hover-item ${glow ? 'aceternity-glowing-card' : ''} ${active ? 'is-active' : ''} ${className}`}
      style={{ '--glow-active': active ? '.35' : '0', ...style }}
      onPointerEnter={() => setHovered(index)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        setHovered(null)
        if (glow) ref.current?.style.setProperty('--glow-active', active ? '.35' : '0')
      }}
      {...props}
    >
      {glow && <div className="aceternity-glow-border" aria-hidden="true" />}
      <AnimatePresence>
        {hovered === index && !active && (
          <motion.span
            layoutId={layoutId}
            className="aceternity-hover-underlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
          />
        )}
      </AnimatePresence>
      <div className="aceternity-hover-content">{children}</div>
    </div>
  )
}

export function PrimaryGlowButton({ children, className = '', ...props }) {
  return (
    <button className={`aceternity-primary-button ${className}`} {...props}>
      <span className="aceternity-button-glow" aria-hidden="true" />
      <span className="aceternity-button-content">{children}</span>
    </button>
  )
}

export function StatefulButton({ children, loadingText = 'Выполняем…', successText = 'Готово', onAction, className = '', ...props }) {
  const [phase, setPhase] = useState('idle')
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleClick = async (event) => {
    if (!onAction || phase === 'loading') return
    setPhase('loading')
    try {
      const result = await onAction(event)
      if (result === false) {
        setPhase('idle')
        return
      }
      setPhase('success')
      timerRef.current = setTimeout(() => setPhase('idle'), 1400)
    } catch (error) {
      setPhase('idle')
      throw error
    }
  }

  return (
    <PrimaryGlowButton
      className={`${className} state-${phase}`}
      {...props}
      onClick={handleClick}
      disabled={phase === 'loading' || props.disabled}
    >
      {phase === 'loading' ? loadingText : phase === 'success' ? successText : children}
    </PrimaryGlowButton>
  )
}

export function AnimatedTabs({ tabs, active, onChange, className = '', ariaLabel = 'Фильтр' }) {
  return (
    <div className={`aceternity-tabs ${className}`} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const selected = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className="aceternity-tab"
          >
            {selected && (
              <motion.span
                layoutId={`active-tab-${ariaLabel}`}
                className="aceternity-tab-active"
                transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
              />
            )}
            <span className="aceternity-tab-label">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const REQUEST_STEPS = ['Создано', 'ИИ анализирует', 'Подключён специалист', 'В работе', 'Решено']

function requestStepIndex(request) {
  if (request?.status === 'done') return 4
  if (request?.level === 'l1' && request?.status === 'waiting') return 2
  if (request?.level === 'l1') return 3
  if (request?.status === 'waiting') return 1
  return 1
}

export function CompactTimeline({ request, className = '' }) {
  const current = requestStepIndex(request)
  const progress = current / (REQUEST_STEPS.length - 1) * 100
  return (
    <div className={`aceternity-timeline ${className}`} aria-label={`Этап обращения: ${REQUEST_STEPS[current]}`}>
      <div className="aceternity-timeline-track" aria-hidden="true">
        <motion.div className="aceternity-timeline-progress" animate={{ width: `${progress}%` }} transition={{ duration: .55, ease: 'easeOut' }} />
      </div>
      {REQUEST_STEPS.map((step, index) => (
        <div key={step} className={`aceternity-timeline-step ${index < current ? 'is-complete' : ''} ${index === current ? 'is-current' : ''}`}>
          <span className="aceternity-timeline-dot" />
          <span className="aceternity-timeline-label">{step}</span>
        </div>
      ))}
    </div>
  )
}

export function AnimatedTooltip({ label, children, className = '' }) {
  const [visible, setVisible] = useState(false)
  const [offset, setOffset] = useState(0)
  return (
    <span
      className={`aceternity-tooltip-wrap ${className}`}
      onPointerEnter={() => setVisible(true)}
      onPointerLeave={() => setVisible(false)}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setOffset(Math.max(-12, Math.min(12, event.clientX - (rect.left + rect.width / 2))))
      }}
    >
      {cloneElement(children, { 'aria-label': children.props['aria-label'] || label })}
      <AnimatePresence>
        {visible && (
          <motion.span
            className="aceternity-tooltip"
            initial={{ opacity: 0, y: 4, scale: .96 }}
            animate={{ opacity: 1, y: 0, x: offset, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: .97 }}
            transition={{ duration: .14 }}
            role="tooltip"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function EventBorder({ active, children, className = '', ...props }) {
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!active) return
    setRunning(true)
    const timer = setTimeout(() => setRunning(false), 3200)
    return () => clearTimeout(timer)
  }, [active])
  return <div className={`aceternity-event-border ${running ? 'is-running' : ''} ${className}`} {...props}>{children}</div>
}

export function ImportantGradient({ children, className = '', animate = false }) {
  return (
    <div className={`aceternity-background-gradient ${animate ? 'is-animated' : ''} ${className}`}>
      <div className="aceternity-background-gradient-inner">{children}</div>
    </div>
  )
}

export function CyclingPlaceholderInput({ placeholders, value, as = 'input', ...props }) {
  const [index, setIndex] = useState(0)
  const Tag = as
  const options = useMemo(() => placeholders?.filter(Boolean) || [], [placeholders])
  useEffect(() => {
    if (value || options.length < 2) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % options.length), 3000)
    return () => clearInterval(timer)
  }, [value, options])
  return <Tag value={value} placeholder={options[index] || props.placeholder} {...props} />
}
