import { MessageCirclePlus, TrendingUp, MessageSquare } from 'lucide-react';

/* ─── Метрики ─── */
const metrics = [
  { label: 'Вопрос получили', value: 3, color: 'var(--bit-accent)' },
  { label: 'В работе', value: 2, color: 'var(--bit-ink)' },
  { label: 'Решено за 30 дней', value: 12, color: 'var(--bit-ink)' },
  { label: 'Среднее время', value: '8 мин', color: 'var(--bit-ink)' },
];

/* ─── Фильтры ─── */
const filters = [
  { key: 'all', label: 'Все' },
  { key: 'open', label: 'Открытые' },
  { key: 'auto', label: 'Авто' },
  { key: 'specialist', label: 'Специалисты' },
  { key: 'done', label: 'Решённые' },
];

/* ─── Бейдж статуса ─── */
const statusBadge = (status) => {
  const map = {
    new:    { label: 'Новый',    bg: 'rgba(230,0,126,0.12)', color: 'var(--bit-accent)' },
    auto:   { label: 'Авто',     bg: 'rgba(134,134,139,0.15)', color: 'var(--bit-muted)' },
    specialist: { label: 'Специалист', bg: 'rgba(26,26,31,0.08)', color: 'var(--bit-ink)' },
    done:   { label: 'Решено',   bg: 'rgba(52,199,89,0.12)', color: '#34C759' },
    waiting: { label: 'Ожидает', bg: 'rgba(134,134,139,0.15)', color: 'var(--bit-muted)' },
  };
  const s = map[status] || map.new;
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
};

/* ─── Бейдж канала ─── */
const channelBadge = (channel) => {
  const map = {
    auto:       { label: 'Авто',     bg: 'rgba(134,134,139,0.15)', color: 'var(--bit-muted)' },
    specialist: { label: 'Специалист', bg: 'rgba(26,26,31,0.08)', color: 'var(--bit-ink)' },
  };
  const c = map[channel] || map.auto;
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.3px',
        background: c.bg,
        color: c.color,
      }}
    >
      {c.label}
    </span>
  );
};

/* ================================================================
   Dashboard
   ================================================================ */
export default function Dashboard({
  requests = [],
  filter = 'all',
  onFilterChange = () => {},
  onOpenDetail = () => {},
  onNavigate = () => {},
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bit-bg, #f7f7f8)' }}>
      {/* ─── Hero ─── */}
      <section
        style={{
          background: 'var(--bit-surface, #fff)',
          borderBottom: '1px solid var(--bit-border, #e5e5e7)',
          padding: '40px 0 48px',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
          <p
            style={{
              fontSize: 14,
              color: 'var(--bit-muted, #86868b)',
              marginBottom: 12,
            }}
          >
            Здравствуйте, Анна · ООО Ромашка
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <h1
              className="gradient-text"
              style={{
                fontSize: 38,
                fontWeight: 800,
                lineHeight: 1.2,
                margin: 0,
                background:
                  'linear-gradient(90deg, var(--bit-ink, #1a1a1f) 0%, var(--bit-accent, #e6007e) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                maxWidth: 620,
              }}
            >
              Что случилось?
            </h1>
            <button
              onClick={() => onNavigate('new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'var(--bit-accent, #e6007e)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform .15s ease, box-shadow .15s ease',
                boxShadow: '0 4px 14px rgba(230,0,126,.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 22px rgba(230,0,126,.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(230,0,126,.25)';
              }}
            >
              <MessageCirclePlus size={20} />
              Просто спросить
            </button>
          </div>
          <p
            style={{
              fontSize: 15,
              color: 'var(--bit-muted, #86868b)',
              margin: '12px 0 0',
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            Опишите ситуацию своими словами. Кого подключить и что делать
            дальше — решим мы.
          </p>
        </div>
      </section>

      {/* ─── Метрики ─── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {metrics.map((m) => (
            <div
              key={m.label}
              style={{
                background: 'var(--bit-surface, #fff)',
                border: '1px solid var(--bit-border, #e5e5e7)',
                borderRadius: 14,
                padding: '20px 22px',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                transition: 'transform .2s ease, box-shadow .2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)';
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--bit-muted, #86868b)',
                  marginBottom: 6,
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: m.color,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                }}
              >
                {m.value}
                {m.label === 'Решено за 30 дней' && (
                  <TrendingUp size={18} style={{ opacity: 0.6 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Фильтры + Список ─── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 64px' }}>
        {/* Табы */}
        <div
          style={{
            display: 'inline-flex',
            gap: 4,
            backgroundColor: 'var(--bit-tab-bg, #ececee)',
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
          }}
        >
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => onFilterChange(f.key)}
                style={{
                  border: 'none',
                  borderRadius: 7,
                  padding: '8px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: active ? '#fff' : 'transparent',
                  color: active
                    ? 'var(--bit-ink, #1a1a1f)'
                    : 'var(--bit-muted, #86868b)',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                  transition: 'all .15s ease',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Список обращений */}
        {requests.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((r) => (
              <div
                key={r.id}
                onClick={() => onOpenDetail(r.id)}
                className="request-card"
                style={{
                  background: 'var(--bit-surface, #fff)',
                  border: '1px solid var(--bit-border, #e5e5e7)',
                  borderRadius: 12,
                  padding: '18px 22px',
                  cursor: 'pointer',
                  transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,.07)';
                  e.currentTarget.style.borderColor = 'var(--bit-accent, #e6007e)';
                  const title = e.currentTarget.querySelector('[data-title]');
                  if (title) title.style.color = 'var(--bit-accent, #e6007e)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--bit-border, #e5e5e7)';
                  const title = e.currentTarget.querySelector('[data-title]');
                  if (title) title.style.color = 'var(--bit-ink, #1a1a1f)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      {statusBadge(r.status)}
                      {channelBadge(r.channel || 'auto')}
                    </div>
                    <h3
                      data-title
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        margin: '0 0 4px',
                        color: 'var(--bit-ink, #1a1a1f)',
                        transition: 'color .15s ease',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.title}
                    </h3>
                    {r.description && (
                      <p
                        style={{
                          fontSize: 13,
                          color: 'var(--bit-muted, #86868b)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.description}
                      </p>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--bit-muted, #86868b)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.date}
                    </span>
                    {r.unread > 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--bit-accent, #e6007e)',
                        }}
                      >
                        <MessageSquare size={13} />
                        {r.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── Пустое состояние ─── */
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'var(--bit-surface, #fff)',
              border: '1px solid var(--bit-border, #e5e5e7)',
              borderRadius: 14,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'var(--bit-tab-bg, #ececee)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare
                size={26}
                style={{ color: 'var(--bit-muted, #86868b)' }}
              />
            </div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--bit-ink, #1a1a1f)',
                margin: '0 0 4px',
              }}
            >
              Вопросов пока нет
            </p>
            <p
              style={{
                fontSize: 14,
                color: 'var(--bit-muted, #86868b)',
                margin: '0 0 20px',
              }}
            >
              Просто спросите — и мы начнём
            </p>
            <button
              onClick={() => onNavigate('new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'var(--bit-accent, #e6007e)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 22px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform .15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <MessageCirclePlus size={18} />
              Просто спросить
            </button>
          </div>
        )}
      </section>
    </div>
  );
}