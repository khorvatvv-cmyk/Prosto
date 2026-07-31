import { MessageCircle, Layers, UserPlus, Check, Calendar, ChevronRight } from 'lucide-react';

const NOTIFICATIONS = [
  {
    id: 1,
    icon: MessageCircle,
    iconColor: '#E50071',
    title: 'Новый ответ по обращению #1248',
    description: 'Специалист L1 ответил на ваше обращение «Настройка обмена с банком».',
    time: '10 минут назад',
    unread: true,
    navigate: 'detail',
  },
  {
    id: 2,
    icon: Layers,
    iconColor: '#3B82F6',
    title: 'Обновление конфигурации',
    description: 'Доступно обновление 1С:Бухгалтерия 8.3 (ред. 3.0). Версия 3.0.142.',
    time: '1 час назад',
    unread: true,
    navigate: 'important',
  },
  {
    id: 3,
    icon: UserPlus,
    iconColor: '#F59E0B',
    title: 'Назначен новый менеджер',
    description: 'Ваш персональный менеджер — Анна Петрова. Свяжитесь для согласования плана работ.',
    time: '3 часа назад',
    unread: true,
    navigate: 'detail',
  },
  {
    id: 4,
    icon: Check,
    iconColor: '#22C55E',
    title: 'Обращение #1240 закрыто',
    description: 'Обращение «Доработка печатной формы» помечено как «Решено». Оцените работу.',
    time: 'Вчера',
    unread: false,
    navigate: 'detail',
  },
  {
    id: 5,
    icon: Calendar,
    iconColor: '#8B5CF6',
    title: 'Срок договора ИТС подходит к концу',
    description: 'Договор ИТС ПРОФ действует до 31.12.2026. Продлите со скидкой до 15%.',
    time: '2 дня назад',
    unread: false,
    navigate: 'important',
  },
];

export default function Notifications({ onNavigate }) {
  return (
    <div style={{ padding: '32px 24px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink-muted)', marginBottom: '20px' }}>
        <span>Главная</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>Уведомления</span>
      </div>

      <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Уведомления</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)', margin: '0 0 24px 0' }}>3 непрочитанных из 5</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {NOTIFICATIONS.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              onClick={() => onNavigate(n.navigate)}
              className="notif-card"
              style={{
                position: 'relative',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                padding: '16px 20px 16px 24px',
                borderRadius: '12px',
                border: `1px solid var(--color-border)`,
                background: n.unread ? 'var(--color-surface)' : 'var(--color-surface-2)',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {/* Left bar for unread */}
              {n.unread && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: '#E50071',
                  }}
                />
              )}

              {/* Icon */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${n.iconColor}12`,
                  color: n.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: n.unread ? 600 : 500,
                      color: 'var(--color-ink)',
                      margin: 0,
                    }}
                  >
                    {n.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {n.time}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: 0 }}>
                  {n.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .notif-card:hover {
          border-color: #E50071 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
      `}</style>
    </div>
  );
}
