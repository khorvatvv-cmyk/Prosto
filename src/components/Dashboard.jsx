import { MessageCirclePlus, TrendingUp, MessageSquare } from 'lucide-react'

export default function Dashboard({ requests, filter, onFilterChange, onOpenDetail, onNavigate, user }) {
  const ACCENT = 'var(--color-accent)'
  const INK = 'var(--color-ink)'
  const INK_MUTED = 'var(--color-ink-muted)'
  const INK_LIGHT = 'var(--color-ink-light)'
  const SURFACE = 'var(--color-surface)'
  const SURFACE_2 = 'var(--color-surface-2)'
  const BORDER = 'var(--color-border)'

  const filtered = filter === 'all' ? requests : requests.filter(r => {
    if (filter === 'open') return r.status === 'open' || r.status === 'waiting'
    if (filter === 'l0') return r.level === 'l0'
    if (filter === 'l1') return r.level === 'l1'
    if (filter === 'done') return r.status === 'done'
    return true
  })

  const openCount = requests.filter(r => r.status === 'open' || r.status === 'waiting').length
  const inWork = requests.filter(r => r.status === 'waiting').length
  const done = requests.filter(r => r.status === 'done').length

  const metrics = [
    { label: 'Открыто', value: openCount, accent: true },
    { label: 'В работе', value: inWork },
    { label: 'Решено', value: done },
    { label: 'Всего', value: requests.length },
  ]

  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'open', label: 'Открытые' },
    { id: 'l0', label: 'Авто' },
    { id: 'l1', label: 'Специалисты' },
    { id: 'done', label: 'Решённые' },
  ]

  const getBadge = (r) => {
    if (r.status === 'done') return { cls: 'badge-done', text: 'Решено' }
    if (r.status === 'waiting') return { cls: 'badge-waiting', text: 'Ожидает' }
    if (r.level === 'l0') return { cls: 'badge-l0', text: 'Авто' }
    if (r.level === 'l1') return { cls: 'badge-l1', text: 'Специалист' }
    return { cls: 'badge-new', text: 'Новый' }
  }

  const formatDate = (d) => {
    if (!d) return ''
    return d.split(' ')[0].split('-').reverse().join('.').slice(0, 5)
  }

  return (
    <div className="animate-fade-up">
      {/* HERO */}
      <div className="flex items-start justify-between gap-6 mb-8 flex-col md:flex-row">
        <div>
          <div style={{ fontSize: 14, color: INK_MUTED, marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: INK }}>Здравствуйте{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</span>
          </div>
          <h1 className="gradient-text" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.05 }}>
            Что случилось?
          </h1>
          <p style={{ fontSize: 15, color: INK_MUTED, marginTop: 8, maxWidth: 400 }}>
            Опишите ситуацию своими словами. Кого подключить и что делать дальше — решим мы.
          </p>
        </div>
        <button onClick={() => onNavigate('new')} className="inline-flex items-center gap-2 flex-shrink-0"
          style={{ background: ACCENT, color: '#fff', border: 'none', padding: '0 26px', height: 50, fontSize: 15, fontWeight: 600, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--color-accent-hover)';e.currentTarget.style.boxShadow='0 6px 20px rgba(229,0,113,.25)'}}
          onMouseLeave={e=>{e.currentTarget.style.background=ACCENT;e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,.03)'}}>
          <MessageCirclePlus size={18} /> Просто спросить
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8 stagger">
        {metrics.map((m, i) => (
          <div key={i} className="transition-all cursor-default"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: 20, borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--color-border-strong)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.06),0 2px 6px rgba(0,0,0,.04)';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,.03)';e.currentTarget.style.transform='translateY(0)'}}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: INK_LIGHT, marginBottom: 10 }}>{m.label}</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1, color: m.accent ? ACCENT : INK }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* SECTION HEAD */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Последние вопросы</h2>
        <a onClick={() => onNavigate('new')} style={{ fontSize: 13, fontWeight: 500, color: INK_MUTED, cursor: 'pointer' }}
          onMouseEnter={e=>e.target.style.color=ACCENT} onMouseLeave={e=>e.target.style.color=INK_MUTED}>
          Задать вопрос →
        </a>
      </div>

      {/* FILTERS */}
      <div className="flex gap-1 mb-3 p-1 inline-flex" style={{ background: SURFACE_2, borderRadius: 10, width: 'fit-content' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => onFilterChange(f.id)}
            style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
              color: filter === f.id ? INK : INK_MUTED, background: filter === f.id ? SURFACE : 'transparent', boxShadow: filter === f.id ? '0 1px 2px rgba(0,0,0,.03)' : 'none' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* REQUEST LIST */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div style={{ padding: '56px 0', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: SURFACE_2, borderRadius: 10 }}>
              <MessageSquare size={28} style={{ color: INK_LIGHT }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Вопросов пока нет</h2>
            <p style={{ fontSize: 14, color: INK_MUTED, marginBottom: 22 }}>Просто спросите — и мы начнём</p>
            <button onClick={() => onNavigate('new')} className="inline-flex items-center gap-2"
              style={{ background: ACCENT, color: '#fff', border: 'none', padding: '0 26px', height: 50, fontSize: 15, fontWeight: 600, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
              <MessageCirclePlus size={18} /> Просто спросить
            </button>
          </div>
        ) : (
          filtered.map((r, i) => {
            const badge = getBadge(r)
            return (
              <div key={r.id} onClick={() => onOpenDetail(r.id)} className="animate-fade-up cursor-pointer transition-all flex items-center gap-3.5 p-3.5"
                style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, boxShadow: '0 1px 2px rgba(0,0,0,.03)', animationDelay: `${i*0.04}s` }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--color-border-strong)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.06),0 2px 6px rgba(0,0,0,.04)';e.currentTarget.style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,.03)';e.currentTarget.style.transform='translateY(0)'}}>
                <div style={{ width: 90, flexShrink: 0 }}>
                  <span className={`badge ${badge.cls}`} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 6 }}>{badge.text}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: INK_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description || ''}</div>
                </div>
                <div style={{ width: 70, flexShrink: 0, textAlign: 'right', fontSize: 13, color: INK_MUTED }}>{formatDate(r.created_at)}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
