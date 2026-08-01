import { MessageCirclePlus, MessageSquare, Clock, CheckCircle2 } from 'lucide-react'

export default function Dashboard({ requests, filter, onFilterChange, onOpenDetail, onNavigate, user }) {
  const A = '#E50071', AH = '#C70060'
  const INK = '#18181B', M = '#6B6B70', L = '#A0A0A5'
  const S = '#FFFFFF', S2 = '#F4F4F5', BD = '#E4E4E7'

  const filtered = filter === 'all' ? requests : requests.filter(r => {
    if (filter === 'open') return r.status === 'open' || r.status === 'waiting'
    if (filter === 'l0') return r.level === 'l0'
    if (filter === 'l1') return r.level === 'l1'
    if (filter === 'done') return r.status === 'done'
    return true
  })

  const openCount = requests.filter(r => r.status === 'open' || r.status === 'waiting').length
  const doneCount = requests.filter(r => r.status === 'done').length

  const metrics = [
    { label: 'Открыто', value: openCount, accent: true, icon: Clock },
    { label: 'Решено', value: doneCount, icon: CheckCircle2 },
    { label: 'Всего', value: requests.length, icon: MessageSquare },
  ]

  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'open', label: 'Открытые' },
    { id: 'done', label: 'Решённые' },
  ]

  const getBadge = (r) => {
    if (r.status === 'done') return { text: 'Решено', bg: S2, color: M, border: BD }
    if (r.status === 'waiting') return { text: 'Ожидает', bg: S2, color: INK, border: BD }
    if (r.level === 'l0') return { text: 'Ответ получен', bg: '#FFF0F7', color: A, border: '#FFF0F7' }
    return { text: 'Новый', bg: '#FFF0F7', color: A, border: '#FFF0F7' }
  }

  const formatDate = (d) => {
    if (!d) return ''
    return d.split(' ')[0].split('-').reverse().join('.').slice(0, 5)
  }

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      {/* HERO */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <div style={{ fontSize: 14, color: M, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: INK }}>Здравствуйте{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1, color: INK, marginBottom: 8 }}>
            Опишите вопрос —<br/>
            <span style={{ background: `linear-gradient(135deg, ${INK} 0%, ${A} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              остальное сделаем мы
            </span>
          </h1>
          <p style={{ fontSize: 15, color: M, maxWidth: 400, lineHeight: 1.6 }}>
            Просто расскажите, что произошло. Мы найдём решение или подключим нужного специалиста.
          </p>
        </div>
        <button onClick={() => onNavigate('new')}
          style={{ background: A, color: '#fff', border: 'none', padding: '0 24px', height: 48, fontSize: 15, fontWeight: 600, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all .2s', boxShadow: '0 4px 14px rgba(229,0,113,.2)', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = AH; e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,0,113,.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = A; e.currentTarget.style.boxShadow = '0 4px 14px rgba(229,0,113,.2)' }}>
          <MessageCirclePlus size={18} /> Просто спросить
        </button>
      </div>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        {metrics.map((m, i) => {
          const Icon = m.icon
          return (
            <div key={i}
              style={{ background: S, border: `1px solid ${BD}`, padding: 18, borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,.03)', transition: 'all .2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4D4D8'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.06)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,.03)'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: m.accent ? '#FFF0F7' : S2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color: m.accent ? A : M }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: L }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1, color: m.accent ? A : INK }}>{m.value}</div>
            </div>
          )
        })}
      </div>

      {/* SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: INK }}>Мои вопросы</h2>
        <button onClick={() => onNavigate('new')} style={{ fontSize: 13, fontWeight: 500, color: M, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}
          onMouseEnter={e => e.target.style.color = A} onMouseLeave={e => e.target.style.color = M}>
          Задать вопрос →
        </button>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 12, padding: 4, background: S2, borderRadius: 10, width: 'fit-content' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => onFilterChange(f.id)}
            style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
              color: filter === f.id ? INK : M, background: filter === f.id ? S : 'transparent', boxShadow: filter === f.id ? '0 1px 2px rgba(0,0,0,.03)' : 'none' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '56px 0', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: S2, borderRadius: 12 }}>
              <MessageSquare size={28} style={{ color: L }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: INK }}>Вопросов пока нет</h2>
            <p style={{ fontSize: 14, color: M, marginBottom: 22 }}>Просто спросите — и мы начнём</p>
            <button onClick={() => onNavigate('new')}
              style={{ background: A, color: '#fff', border: 'none', padding: '0 24px', height: 48, fontSize: 15, fontWeight: 600, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <MessageCirclePlus size={18} /> Просто спросить
            </button>
          </div>
        ) : (
          filtered.map((r, i) => {
            const badge = getBadge(r)
            return (
              <div key={r.id} onClick={() => onOpenDetail(r.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: `1px solid ${BD}`, borderRadius: 10, background: S, boxShadow: '0 1px 2px rgba(0,0,0,.03)', cursor: 'pointer', transition: 'all .2s', animation: `fadeUp .4s ease both`, animationDelay: `${i*0.04}s` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4D4D8'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.06)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,.03)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ width: 100, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '3px 9px', borderRadius: 6, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>{badge.text}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: INK }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: M, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description || ''}</div>
                </div>
                <div style={{ fontSize: 13, color: M, flexShrink: 0 }}>{formatDate(r.created_at)}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
