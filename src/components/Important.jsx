import React from 'react';
import { MessageCircleMore, Printer, Percent, ArrowRight } from 'lucide-react';

const cards = [
  {
    id: 1,
    icon: MessageCircleMore,
    title: 'Настройка обмена с банком',
    description:
      'Специалист выявил потребность в отдельной работе. Ваш менеджер подготовит предложение.',
    buttonLabel: 'Обсудить',
  },
  {
    id: 2,
    icon: Printer,
    title: 'Доработка печатной формы',
    description: 'Наряд уже создан, исполнитель назначен.',
    buttonLabel: 'Открыть вопрос',
  },
  {
    id: 3,
    icon: Percent,
    title: 'Продление ИТС ПРОФ со скидкой',
    description: 'При продлении до 1 октября — скидка 10%.',
    buttonLabel: 'Обсудить продление',
  },
];

export default function Important({ onNavigate, onOpenManager }) {
  const handleButtonClick = (label) => {
    if (label === 'Обсудить' || label === 'Обсудить продление') {
      onOpenManager?.();
    } else {
      onNavigate?.('support');
    }
  };

  return (
    <section style={{ padding: '24px 16px 8px' }}>
      {/* Заголовок */}
      <h2
        style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: 700,
          lineHeight: '28px',
          color: 'var(--color-ink)',
        }}
      >
        Важное для вас
      </h2>
      <p
        style={{
          margin: '6px 0 20px',
          fontSize: '14px',
          lineHeight: '20px',
          color: 'var(--color-ink-muted)',
        }}
      >
        Рекомендации от вашего менеджера и предложения по продуктам и сервисам 1С
      </p>

      {/* Карточки */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              transition: 'box-shadow 0.2s ease',
            }}
            className="hover:shadow-sm"
          >
            {/* Иконка */}
            <div
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'var(--color-accent)',
              }}
            >
              <card.icon size={20} />
            </div>

            {/* Текст + кнопка */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 600,
                  lineHeight: '20px',
                  color: 'var(--color-ink)',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  margin: '4px 0 10px',
                  fontSize: '13px',
                  lineHeight: '18px',
                  color: 'var(--color-ink-muted)',
                }}
              >
                {card.description}
              </p>

              <button
                type="button"
                onClick={() => handleButtonClick(card.buttonLabel)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  lineHeight: '16px',
                  color: '#fff',
                  backgroundColor: 'var(--color-accent)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
                className="hover:opacity-90 active:opacity-80"
              >
                {card.buttonLabel}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}