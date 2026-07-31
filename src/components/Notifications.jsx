import React from 'react';
import {
  MailOpen,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const notifications = [
  {
    id: 1,
    icon: MailOpen,
    title: 'Получен автоматический ответ',
    description: 'Проверьте, помогло ли решение.',
    unread: true,
  },
  {
    id: 2,
    icon: Sparkles,
    title: 'Новое предложение для вас',
    description: 'Посмотрите в разделе «Важное».',
    unread: true,
  },
  {
    id: 3,
    icon: UserCheck,
    title: 'Подключили специалиста',
    description: 'Сергей К. уже изучает ваш вопрос.',
    unread: true,
  },
  {
    id: 4,
    icon: CheckCircle2,
    title: 'Вопрос решён',
    description: 'Спасибо за подтверждение!',
    unread: false,
  },
  {
    id: 5,
    icon: Clock,
    title: 'Продление ИТС ПРОФ',
    description: 'Менеджер свяжется с вами.',
    unread: false,
  },
];

export default function Notifications({ onNavigate }) {
  return (
    <section style={{ padding: '24px 16px 8px' }}>
      {/* Заголовок */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: '28px',
            color: 'var(--color-ink)',
          }}
        >
          Уведомления
        </h2>

        <button
          type="button"
          onClick={() => onNavigate?.('profile')}
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Профиль
        </button>
      </div>

      {/* Список уведомлений */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {notifications.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 12px',
              borderRadius: '12px',
              backgroundColor: item.unread
                ? 'color-mix(in srgb, var(--color-accent) 4%, var(--color-surface))'
                : 'transparent',
              borderLeft: item.unread
                ? '3px solid var(--color-accent)'
                : '3px solid transparent',
              transition: 'background-color 0.15s ease',
              cursor: 'default',
            }}
            className={item.unread ? 'hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))]' : ''}
          >
            {/* Иконка */}
            <div
              style={{
                flexShrink: 0,
                width: 36,
                height: 36,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: item.unread
                  ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                  : 'var(--color-surface-2)',
                color: item.unread ? 'var(--color-accent)' : 'var(--color-ink-muted)',
              }}
            >
              <item.icon size={18} />
            </div>

            {/* Текст */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: item.unread ? 600 : 400,
                  lineHeight: '18px',
                  color: 'var(--color-ink)',
                }}
              >
                {item.title}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '13px',
                  lineHeight: '17px',
                  color: 'var(--color-ink-muted)',
                }}
              >
                {item.description}
              </p>
            </div>

            {/* Индикатор непрочитанного (точка) */}
            {item.unread && (
              <div
                style={{
                  flexShrink: 0,
                  width: 8,
                  height: 8,
                  marginTop: 6,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-accent)',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}