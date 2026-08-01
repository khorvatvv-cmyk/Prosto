import { Sparkles, MessageCircle } from 'lucide-react'

export default function Important({ onOpenManager }) {
  return (
    <section style={{ padding: '24px 16px 8px' }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--color-ink)' }}>
        Важное для вас
      </h1>
      <p style={{ margin: '8px 0 24px', fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-muted)' }}>
        Здесь появятся реальные рекомендации по вашим обращениям, продуктам и срокам сопровождения.
      </p>

      <div style={{ maxWidth: 620, padding: '32px 24px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: 14, background: 'var(--color-surface)' }}>
        <div style={{ width: 52, height: 52, margin: '0 auto 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-accent-tint)', color: 'var(--color-accent)' }}>
          <Sparkles size={24} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--color-ink)' }}>Новых рекомендаций пока нет</h2>
        <p style={{ margin: '0 auto 20px', maxWidth: 420, fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-muted)' }}>
          Мы не показываем демонстрационные предложения как реальные. Если нужно что-то уточнить, напишите команде сопровождения.
        </p>
        <button type="button" onClick={onOpenManager} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px', border: 'none', borderRadius: 9, background: 'var(--color-accent)', color: '#fff', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>
          <MessageCircle size={17} /> Написать команде
        </button>
      </div>
    </section>
  )
}
