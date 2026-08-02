import { useState, useEffect, useCallback } from 'react'
import { Sparkles, X, Megaphone, ArrowRight } from 'lucide-react'
import { feedApi } from '../api.js'
import { GlowingCard, ImportantGradient, PrimaryGlowButton } from './ui/AceternityEffects.jsx'

const A = '#E50071'
const INK = '#18181B'
const M = '#6B6B70'
const L = '#A0A0A5'
const S = '#FFFFFF'
const BD = '#E4E4E7'

const CATEGORY_LABELS = {
  info: 'Информация',
  news: 'Новость',
  promo: 'Акция',
  event: 'Событие',
}

export default function Important({ showToast, onNavigate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState({})

  const load = useCallback(async () => {
    try {
      const data = await feedApi.list()
      setItems(data.items || [])
    } catch (e) {
      console.error('Feed load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const setBusyKey = (key, val) => setBusy(prev => ({ ...prev, [key]: val }))

  const handleOpen = async (id) => {
    try {
      await feedApi.action(id, 'open')
    } catch (e) {
      console.error('Feed open error:', e)
    }
  }

  const handleAction = async (id) => {
    setBusyKey(id, true)
    try {
      await feedApi.action(id, 'manager')
      if (onNavigate) onNavigate('manager-chat')
    } catch (e) {
      if (showToast) showToast('Ошибка: ' + e.message)
    } finally {
      setBusyKey(id, false)
    }
  }

  const handleHide = async (id) => {
    setBusyKey(`h-${id}`, true)
    try {
      await feedApi.action(id, 'hide')
      setItems(prev => prev.filter(item => item.id !== id))
      if (showToast) showToast('Материал скрыт')
    } catch (e) {
      if (showToast) showToast('Ошибка: ' + e.message)
    } finally {
      setBusyKey(`h-${id}`, false)
    }
  }

  const categoryLabel = (cat) => CATEGORY_LABELS[cat] || cat || 'Информация'

  return (
    <section style={{ padding: '24px 16px 8px' }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: INK }}>
        Важное для вас
      </h1>
      <p style={{ margin: '8px 0 24px', fontSize: 14, lineHeight: 1.55, color: M }}>
        Рекомендации по вашим обращениям, продуктам и срокам сопровождения.
      </p>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: M }}>Загрузка материалов…</div>
      ) : items.length === 0 ? (
        <div style={{ maxWidth: 620, padding: '32px 24px', textAlign: 'center', border: `1px solid ${BD}`, borderRadius: 14, background: S }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF0F7', color: A }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, color: INK }}>Новых материалов пока нет</h2>
          <p style={{ margin: '0', maxWidth: 420, marginInline: 'auto', fontSize: 14, lineHeight: 1.55, color: M }}>
            Мы не показываем демонстрационные предложения как реальные. Если нужно что-то уточнить, напишите команде сопровождения.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, index) => {
            const card = (
            <GlowingCard key={item.id} spotlight onClick={() => handleOpen(item.id)}
              style={{ background: S, border: `1px solid ${BD}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all .2s', boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
              >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '2px 10px', borderRadius: 6, background: '#FFF0F7', color: A }}>
                      {categoryLabel(item.category)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: L }}>
                      <Megaphone size={13} /> {item.author_name || ''}
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: INK }}>{item.title}</h2>
                  {item.subject && <div style={{ fontSize: 13, fontWeight: 600, color: M, marginBottom: 4 }}>{item.subject}</div>}
                  {item.short_text && <div style={{ fontSize: 14, color: M, lineHeight: 1.55 }}>{item.short_text}</div>}
                  {item.full_text && item.short_text && <div style={{ fontSize: 14, color: M, lineHeight: 1.55, marginTop: 8 }}>{item.full_text}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14 }}>
                {item.action_label && (
                  <PrimaryGlowButton onClick={(e) => { e.stopPropagation(); handleAction(item.id) }} disabled={busy[item.id]}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: A, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <ArrowRight size={15} /> {item.action_label}
                  </PrimaryGlowButton>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleHide(item.id) }} disabled={busy[`h-${item.id}`]}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: S, color: M, border: `1px solid ${BD}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <X size={15} /> Скрыть
                </button>
              </div>
            </GlowingCard>
            )
            return index === 0 ? <ImportantGradient key={item.id}>{card}</ImportantGradient> : card
          })}
        </div>
      )}
    </section>
  )
}
