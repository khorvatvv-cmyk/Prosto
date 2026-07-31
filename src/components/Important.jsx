import { Clock, FileText, Calendar, ChevronRight } from 'lucide-react';

const OFFERS = [
  {
    id: 1,
    title: 'Настройка обмена с банком',
    description: 'Подключим и настроим обмен данными с клиент-банком. Синхронизация выписок и платёжных поручений в 1С.',
    status: 'Новое',
    statusColor: '#E50071',
    meta: 'Ответ в течение 2 часов',
    icon: FileText,
    action: 'onOpenManager',
  },
  {
    id: 2,
    title: 'Доработка печатной формы ТОРГ-12',
    description: 'Адаптируем печатную форму ТОРГ-12 под требования вашей организации: реквизиты, подписи, логотип.',
    status: 'В работе',
    statusColor: '#3B82F6',
    meta: 'Специалист назначен',
    icon: Clock,
    action: 'onNavigate',
    actionArg: 'detail',
  },
  {
    id: 3,
    title: 'Продление ИТС ПРОФ со скидкой',
    description: 'Продлите договор ИТС ПРОФ по спеццене — скидка до 15%. Доступ ко всем обновлениям и линии консультаций.',
    status: 'Предложение',
    statusColor: '#F59E0B',
    meta: 'Срок действия скидки: до 31 августа',
    icon: Calendar,
    action: 'onOpenManager',
  },
];

export default function Important({ onNavigate, onOpenManager }) {
  const handleClick = (offer) => {
    if (offer.action === 'onOpenManager') onOpenManager();
    else if (offer.action === 'onNavigate') onNavigate(offer.actionArg);
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink-muted)', marginBottom: '20px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('requests')}>
          Главная
        </span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>Важное для вас</span>
      </div>

      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Важное для вас</h1>
        <span style={{ fontSize: '14px', color: 'var(--color-ink-muted)' }}>2 предложения</span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {OFFERS.map((offer) => {
          const Icon = offer.icon;
          return (
            <div
              key={offer.id}
              onClick={() => handleClick(offer)}
              className="offer-card"
              style={{
                position: 'relative',
                background: 'var(--color-surface)',
                border: `1px solid var(--color-border)`,
                borderRadius: '12px',
                padding: '20px 24px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
              }}
            >
              {/* Left accent bar */}
              <span
                className="offer-bar"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: offer.statusColor,
                  opacity: 0,
                  transition: 'opacity 0.18s ease',
                }}
              />
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: `${offer.statusColor}12`,
                    color: offer.statusColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{offer.title}</h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: `${offer.statusColor}12`,
                        color: offer.statusColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {offer.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)', lineHeight: 1.55, margin: '0 0 10px 0' }}>
                    {offer.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                    <Clock size={13} />
                    {offer.meta}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button
                      className="offer-btn-primary"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#E50071',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      {offer.action === 'onOpenManager' ? 'Обсудить с менеджером' : 'Открыть обращение'}
                    </button>
                    <button
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `1px solid var(--color-border)`,
                        background: 'var(--color-surface)',
                        color: 'var(--color-ink)',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Позже
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .offer-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          border-color: #E50071 !important;
        }
        .offer-card:hover .offer-bar {
          opacity: 1;
        }
        .offer-btn-primary:hover {
          background: #B0005A !important;
        }
      `}</style>
    </div>
  );
}
